# READ-IT's semantic search feature

Semantic search enables the user to query the items that have been linked to the sources through annotations, optionally traversing relations between the items. The feature is essentially a visual way to compose SPARQL queries, which is meant to be easier to operate than SPARQL itself. While semantic search does not cover all language features of SPARQL, it should cover a sufficiently expressive subset that nearly all conceivable queries are possible. As such, the feature is comparable to a visual programming system.

The current README explains the overall architecture of the feature. Additional documentation is present in each of the modules.


## How it works, in a nutshell

On the search page, the user can choose between two types of search: text search or semantic search. In the second case, the user clicks or types her way through a dynamic, recursive form, mostly consisting of dropdown menus. The form manipulates an underlying data model which is a mixture of "plain vanilla" `Backbone.Model`s and `Backbone.Collection`s as well as our own `Subject`/`Graph` subclasses for RDF support, all wrapped in a `SemanticQuery` (which is also a `Backbone.Model` subclass). When submitted, the form triggers an event with the complete data model as payload. This event is first handled in the exploration aspect and then in the explorer event controller. The latter saves a lightweight JSON representation of the query to the backend, where the query is given a numerical id. The explorer event controller also uses the `modelToQuery` function to convert the data model to a SPARQL query. This query is sent to the backend as well. The response is shown in a panel in the explorer.

The storage to the backend makes it possible to view the same query again later and to revise it. When the URL of the query, which includes the query's numerical id, is visited in a fresh browser tab, the query corresponding to the numerical id is fetched from the backend and deserialized to the internal data model. This representation is passed both to the semantic search form, so that the user can edit the query again, and to the explorer event controller, where the query is again converted to SPARQL. The results are again shown in an explorer panel, which is what the user will see; the user can however see the corresponding query by clicking on the "Search" navigation tab.


## How it works (and why), in detail

### The conceptual model

Conceptually, the user starts with the set of all items (i.e., instances of ontology classes) in the triplestore and then iteratively narrows down this set, until it only contains the items that he is interested in. He has four types of aids at his disposal in order to perform the narrowing.

1. **Property traversals.** Suppose that the set was previously narrowed down to instances of the *Reader* class, possibly with particular features. The user may further narrow down this set of Readers by posing restrictions on what each Reader *performed*. In this example, "performed" is the property that is being traversed in order to narrow down the selection. Subsequent choices made by the user will pertain to whatever each Reader in the set performed.
2. **Type expectations.** Continuing the above example, there are many different kinds of things that a Reader may perform. Besides performing an *Act of Reading*, a Reader may for example also (per)form an *Emotion* or *Mental Imagery*. Different properties and filters apply to Acts of Reading than apply to Emotions. In order to find appropriate properties to traverse or filters to apply next, the user first selects the type of item the current selection pertains to. For example, if the user selects Act of Reading as the expected type, then the user will next be able to select *was influenced by* as a property to traverse. A type expectation is also what enabled the user to restrict the set to Readers initially.
3. **Filters.** So far, the user has narrowed down the set to Readers who performed an Act of Reading that was in turn influenced by something, let's say a *Place*. However, he still has to pose an actual restriction on this Place. This is where filters come in. The most trivial available filter is to simply require that the selection *is defined*. In this case, the set will consist of all Readers who performed an Act of Reading that was influenced by any Place. Alternatively, the user may specify that it must be a particular Place. There are also filters for literal values, such as less/greater and substring matching. Once a filter has been applied, the selection is fully specified.
4. **Logic.** What if the user wants either Readers or *Authors*? What if the user wants to put restrictions not only on the Place that the Act of Reading was influenced by, but also on the *Intensity* of the Act of Reading? Logic operators enable the user to define multifaceted selection criteria. By selecting the *OR* operator initially, the user can create one branch of selection in which the expected type of the item is Reader, and another in which the expected type is Author, finally combining both sets into a larger set. By selecting the *AND* operator after the Act of Reading type expectation, the user can pose multiple restrictions on the same Act of Reading performed by the Reader. These operators can be freely applied anywhere in the selection process, giving the user the freedom to create queries of arbitrary complexity. There is also a *NOT* operator in order to express counterfactual criteria.

The above four types of aids will be frequently referred to below.


### The data model

The data model serves as an *intermediate representation* (IR) between the view that the user operates and the SPARQL query that is sent to the backend. Having such an IR helps separate concerns and thus simplifies the logic. The IR is implemented using regular `Backbone.Model`s and `Backbone.Collection`s, due to the following considerations:

- The user must be able to store a query and edit it again later. This requires a serialized representation of the query.
- SPARQL is suitable for storage, but parsing SPARQL in order to reconstruct the UI view from which it originated is extremely difficult.
- Converting back and forth between Backbone views and Backbone models, on the other hand, is a solved problem; we do this all the time in Backbone applications (it is especially easy thanks to the abstractions provided by the `backbone-fractal` library).
- Likewise, serializing and deserializing Backbone models to and from JSON is a solved problem. Hence, we get reproducible query storage almost for free.
- Converting Backbone models to SPARQL, while not trivial, is possibly still simpler than generating SPARQL from the view directly.
- `Backbone.Model` and `Backbone.Collection` are feature-complete for the purpose of this IR; no subclassing is required.

In conclusion, the IR is the abstract representation of the query that stands between the view for user operation, JSON for query storage, and SPARQL for query execution. Thanks to this design, conversion between IR and SPARQL needs to be solved in one direction only.

The IR is kept in the `query` attribute of a `SemanticQuery` model (defined in `./model.ts`). The latter's only special responsibility is to serialize and deserialize the IR to and from the lightweight JSON representation that is stored in the backend. Besides that, it holds the `label` attribute that users can set in order to give their queries recognizable names.

Due to the use of plain, unrefined Backbone models and their dynamically typed nature, there is no need for a dedicated module that describes the IR in code. The data model is more or less implicit in the other modules. A bottom-up structural description follows. For complete and up-to-date information of all model attributes involved, please refer to the code.

Property traversals and type expectations are encoded as the `Subject`s representing their respective RDF properties and classes from the ontology. Filters and logic operators are encoded using regular `Backbone.Model`s, which are defined in the `dropdown-constants` module. In all four cases, the encoded aid (`Subject` or plain model) is wrapped inside the `selection` attribute of a regular `Backbone.Model`. The latter, containing model serves as the `.model` for the `Dropdown` view (further discussed below), and generally contains additional attributes in order to serve view rendering, SPARQL generation, or both. For the present discussion, we will refer to this containing model as a "dropdown model".

After selecting a filter, the user needs to provide an argument to this filter (for example, *which* specific Place an Act of Reading must be influenced by). This information is encoded in the `value` attribute of another regular `Backbone.Model`, which serves as the `.model` for a `FilterInput` and which we will refer to as a "filter model". Again, filter models may also contain other attributes in service of view rendering and/or SPARQL generation.

As described in the conceptual model section, the user will typically create a chain of property traversals and type expectations and then terminate it with a filter. In the data model, this is represented as a regular `Backbone.Collection` that starts with zero or more dropdown models and ends with an optional single filter model. This collection is in turn wrapped inside the `chain` attribute of a regular `Backbone.Model`. Unsurprisingly, these respectively serve as the `.collection` and `.model` of a `Chain` view (further discussed below), and we will refer to them as "chain collection" and "chain model".

The AND/OR logic operators introduce the need for a recursive branching structure where multiple chains can run in parallel and each can have multiple sub-chains. This is achieved through the additional `branches` attribute of the dropdown models for these operators. This attribute is set to a regular `Backbone.Collection` containing chain models. It serves as the `.collection` for a `Multibranch` view (again, discussed below) and will be referred to as a "branchout collection". The dropdown model that contains it may also be referred to as a "branchout model".

The root of the data structure must be a chain model. In order for the query to be well-formed, each chain collection may contain at most one branchout model, which must be in the final position. It follows that a chain may terminate with a filter or an AND/OR operator, but never both at the same time. The views are constructed such that these invariants are maintained.


### The `modelToQuery` algorithm

The `modelToQuery` algorithm takes the root chain model of the query IR and returns a matching SPARQL `CONSTRUCT` query. It is quite extensively documented in the `modelToQuery` module.


### The `semChannel` radio

Like the data model, the UI is potentially highly recursive. Due to the interactive nature of the semantic search form, the Backbone views that it is composed of constantly need to communicate. A `Backbone.Radio` channel by the name `semChannel` is used as a central communication hub, in order to avoid complicated event forwarding cascades and cyclical imports. In effect, this provides an additional separation of concerns besides the IR.


### The views

In the discussion of the data model, we briefly touched on the view classes that correspond to each of the data model's main constituents:

- `Dropdown` enables the user to control the `selection` of a dropdown model. It combines all four types of aids in a single UI element.
- `FilterInput` enables a user to set the `value` of a filter model.
- `Chain` enables the user to compose a chain collection, within the limits of well-formedness.
- `Multibranch` enables the user to add and remove chains to and from a branchout collection.

A fifth view class, `SemanticSearch`, represents the search form as a whole.

Visually, the `SemanticSearch` form consists of a single `Chain` view with a label input and a submit button below it. The `Chain` view initially consists of a single blank `Dropdown` view. Every time the user makes a selection in a `Dropdown` view, a new blank `Dropdown` is added to the right of it, thus building the underlying chain collection one model at a time (the available options within each `Dropdown` depend on the choices that were previously made). If the sequence of `Dropdown`s does not fit in the width of the form, it wraps around and continues on the next line. This buildup can stop in two ways: (1) if the user selects a filter and (2) if the user selects an AND/OR operator. In the first case, a `FilterInput` view is added to the right instead of a `Dropdown` view. In the second case, a `Multibranch` view is presented on the next line.

The `Multibranch` is wrapped inside a generic `Multifield` view (defined in `../forms/`). This assembly initially consists of a single `Chain` view with a "remove" button in front and an "add" button below. As the name suggests, pressing the "add" button will add another row with a `Chain` view with a "remove" button in front. Each `Chain` can be removed with its respective "remove" button and, like the top-level `Chain` of the form, each `Chain` starts with a single blank `Dropdown` view. The assembly as a whole is nested inside its parent `Chain` view. With each additional level of nesting that the user introduces by applying an AND/OR operator again, the indentation of the inner `Chain` views increases.

Under the hood, the `SemanticSearch` form communicates with the recursive structure of `Chain` views and `Multibranch`/`Multifield` assemblies through the `semChannel` radio. The radio is employed for two main purposes. Firstly, the views share information on whether the query is complete; this is the case when every `Multibranch` has at least one `Chain` and each `Chain` ends in either a `Multibranch` or a `FilterInput`. The `SemanticSearch` view ensures that the user can only press the "submit" button when the query is complete. Secondly, `Chain` views defer the creation of the recursive `Multibranch`/`Multifield` assemblies to the `SemanticSearch` view. This prevents the `Chain` module from needing to import the `Multibranch` module, which would otherwise result in a cyclical import.

Further documentation about the individual view classes is present in their respective modules.
