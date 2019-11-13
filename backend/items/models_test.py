import pytest

from .models import ItemCounter
from .constants import ITEMS_NS


def test_ItemCounter_str():
    counter1 = ItemCounter(count=1)
    counter100 = ItemCounter(count=100)
    assert str(counter1) == '{}{}'.format(ITEMS_NS, 1)
    assert str(counter100) == '{}{}'.format(ITEMS_NS, 100)


@pytest.mark.django_db
def test_ItemCounter_current():
    # create from scratch
    instance = ItemCounter.current
    assert isinstance(instance, ItemCounter)
    assert instance.pk == 1
    assert instance.count == 1
    # retrieve cached singleton
    instance = ItemCounter.current
    assert isinstance(instance, ItemCounter)
    assert instance.pk == 1
    assert instance.count == 1
    # retrieve singleton from previous session
    del ItemCounter._current
    instance = ItemCounter.current
    assert isinstance(instance, ItemCounter)
    assert instance.pk == 1
    assert instance.count == 1


@pytest.mark.django_db
def test_ItemCounter_increment():
    counter1 = ItemCounter(count=1)
    counter1.increment()
    counter2 = ItemCounter.objects.all().first()
    assert counter2.pk == counter1.pk
    assert counter2.count == 2
