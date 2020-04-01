from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from rdflib import Graph, Literal, URIRef
from rdflib_django.models import Store
from items import namespace as ITEM


def prune_triples(graph, triples):
    """Remove all items in iterable `triples` from `graph` (modify in place)."""
    for triple in triples:
        graph.remove(triple)


def prune_triples_cascade(graph, triples, graphs_applied_to = [], privileged_predicates = []):
    """
    Recursively remove subjects in `triples` and all related resources from `graph`.
    Specify which graphs qualify, i.e. from which triples will be deleted, in `graphs_applied_to`.
    Optionally, skip items related via specific (privileged) predicates.
    """
    for triple in triples:
        prune_recursively(graph, triple[0], graphs_applied_to, privileged_predicates)

def prune_recursively(graph, subject, graphs_applied_to = [], privileged_predicates = []):
    """
    Recursively remove subject and all related resources from `graph`.
    Specify which graphs qualify, i.e. from which triples will be deleted, in `graphs_applied_to`.
    Optionally, skip deletion of (i.e. keep) items related via specific (privileged) predicates.
    """
    related_by_subject = list(graph.quads((subject, None, None)))

    for s, p, o, c in related_by_subject:
        if isinstance(o, URIRef) and o != s and p not in privileged_predicates and c in graphs_applied_to:
            prune_recursively(graph, o, graphs_applied_to, privileged_predicates)

    prune_triples(graph, related_by_subject)


def append_triples(graph, triples):
    """ Add all items in iterable `triples` to `graph` (modify in place). """
    for triple in triples:
        graph.add(triple)


def graph_from_triples(triples, ctor=Graph):
    """ Return a new Graph containing all items in iterable `triples`. """
    graph = ctor()
    append_triples(graph, triples)
    return graph


def traverse_forward(full_graph, fringe, plys):
    """
    Traverse `full_graph` by object `plys` times, starting from `fringe`.

    Returns a graph with all triples accumulated during the traversal,
    excluding `fringe`.
    """
    result = Graph()
    visited_objects = set()
    while plys > 0:
        objects = set(fringe.objects()) - visited_objects
        if not len(objects):
            break
        fringe = Graph()
        for o in objects:
            if not isinstance(o, Literal):
                append_triples(fringe, full_graph.triples((o, None, None)))
        result |= fringe
        visited_objects |= objects
        plys -= 1
    return result


def traverse_backward(full_graph, fringe, plys):
    """
    Traverse `full_graph` by subject `plys` times, starting from `fringe`.

    Returns a graph with all triples accumulated during the traversal,
    excluding `fringe`. This result always contains complete
    resources, i.e., all triples of each subject in the graph are
    included.
    """
    result = Graph()
    subjects = set(fringe.subjects())
    visited_subjects = set()
    while plys > 0:
        if not len(subjects):
            break
        fringe = Graph()
        fringe_subjects = set()
        for s in subjects:
            parents = set(full_graph.subjects(None, s))
            for ss in parents - fringe_subjects:
                append_triples(fringe, full_graph.triples((ss, None, None)))
            fringe_subjects |= parents
        result |= fringe
        visited_subjects |= subjects
        subjects = set(fringe.subjects()) - visited_subjects
        plys -= 1
    return result


def permission_exists(name, codename):
    '''
    Check if a permission with name and codename exists in the database.

    Parameters:
        name -- User friendly name for the permission.
        codename -- machinename for the permission.
    '''
    return Permission.objects.filter(name=name).filter(codename=codename).exists()

def create_custom_permission(name, codename):
    '''
    Create a custom permission. It will be added on rdflib_django's `Store` model,
    for easy use in the admin module. Note that the combination of 'name' and 'codename'
    must be unique.

    Parameters:
        name -- User friendly name for the permission.
        codename -- machinename for the permission.
    '''
    if not permission_exists(name, codename):
        Permission.objects.create(
            codename=codename,
            name=name,
            content_type=ContentType.objects.get_for_model(Store),
        )

def create_custom_permissions(permissions):
    '''
    Create custom permissions. These will be added on rdflib_django's `Store` model,
    for easy use in the admin module.

    Parameters:
        permissions -- a list of permissions to create. Each permission consists of
        a 'name' (user friendly name) and a 'codename' (machinename). Note that the combination of
        'name' and 'codename' must be unique.
        Example: [{ 'name': 'Can create Permissions', 'codename': 'create_permissions' }]
    '''
    for perm in permissions:
        create_custom_permission(perm['name'], perm['codename'])
