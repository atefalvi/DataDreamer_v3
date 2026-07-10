"""Concurrency gate — the 5-10 simultaneous-user safety net."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from orby.gate import GenerationGate

MAX_CONCURRENT = 2
MAX_QUEUE = 3


@pytest.fixture
def gate():
    return GenerationGate()


async def hold(gate, session, seconds):
    status = await gate.try_acquire(session, MAX_CONCURRENT, MAX_QUEUE)
    if status == "wait":
        status = await gate.wait_for_slot(session, MAX_CONCURRENT, timeout=5)
    if status == "ok":
        await asyncio.sleep(seconds)
        await gate.release(session)
    return status


@pytest.mark.asyncio
async def test_slots_then_queue_then_rejection(gate):
    """10 users, 2 slots, queue of 3 → 5 served over time, 5 rejected cleanly."""
    results = await asyncio.gather(*(hold(gate, f"s{i}", 0.05) for i in range(10)))
    assert results.count("ok") == MAX_CONCURRENT + MAX_QUEUE
    assert results.count("queue_full") == 10 - (MAX_CONCURRENT + MAX_QUEUE)
    assert gate.stats == {"active": 0, "waiting": 0}


@pytest.mark.asyncio
async def test_same_session_cannot_run_twice(gate):
    assert await gate.try_acquire("dup", MAX_CONCURRENT, MAX_QUEUE) == "ok"
    assert await gate.try_acquire("dup", MAX_CONCURRENT, MAX_QUEUE) == "session_busy"
    await gate.release("dup")
    assert await gate.try_acquire("dup", MAX_CONCURRENT, MAX_QUEUE) == "ok"


@pytest.mark.asyncio
async def test_waiter_gets_slot_when_released(gate):
    await gate.try_acquire("a", 1, MAX_QUEUE)
    assert await gate.try_acquire("b", 1, MAX_QUEUE) == "wait"
    waiter = asyncio.create_task(gate.wait_for_slot("b", 1, timeout=2))
    await asyncio.sleep(0.02)
    await gate.release("a")
    assert await waiter == "ok"
    await gate.release("b")


@pytest.mark.asyncio
async def test_queue_timeout_leaves_cleanly(gate):
    await gate.try_acquire("hog", 1, MAX_QUEUE)
    assert await gate.try_acquire("late", 1, MAX_QUEUE) == "wait"
    assert await gate.wait_for_slot("late", 1, timeout=0.05) == "timeout"
    assert gate.stats["waiting"] == 0  # no leak
    # capacity still works afterwards
    await gate.release("hog")
    assert await gate.try_acquire("next", 1, MAX_QUEUE) == "ok"
    await gate.release("next")


@pytest.mark.asyncio
async def test_one_slow_session_does_not_block_others(gate):
    slow = asyncio.create_task(hold(gate, "slow", 0.3))
    await asyncio.sleep(0.01)
    fast = await asyncio.gather(*(hold(gate, f"fast{i}", 0.01) for i in range(3)))
    assert fast.count("ok") >= 3  # all fast users served while slow occupies one slot
    assert await slow == "ok"


@pytest.mark.asyncio
async def test_release_is_idempotent(gate):
    await gate.try_acquire("x", MAX_CONCURRENT, MAX_QUEUE)
    await gate.release("x")
    await gate.release("x")  # double release must not corrupt counters
    assert gate.stats["active"] == 0
