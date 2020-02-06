from rdf.baseclasses import BaseCounter
from .constants import ITEMS_NS, ITEMS_HISTORY_NS


class ItemCounter(BaseCounter):
    namespace = ITEMS_NS


class EditCounter(BaseCounter):
    namespace = ITEMS_HISTORY_NS
