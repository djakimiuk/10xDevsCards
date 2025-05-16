import { renderHook, act } from "@testing-library/react";
import { useFlashcards } from "./useFlashcards";
import { vi, beforeEach, describe, it, expect } from "vitest";

const mockFlashcards = [
  {
    id: "1",
    front: "Test Front 1",
    back: "Test Back 1",
    created_at: "2024-01-01T00:00:00Z",
    source: "MANUAL" as const,
  },
  {
    id: "2",
    front: "Test Front 2",
    back: "Test Back 2",
    created_at: "2024-01-02T00:00:00Z",
    source: "MANUAL" as const,
  },
];

describe("useFlashcards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Setup fetch mock with a default successful response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ flashcards: mockFlashcards }),
    } as Response);
  });

  it("should fetch flashcards successfully", async () => {
    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.flashcards).toEqual(mockFlashcards);
    expect(global.fetch).toHaveBeenCalledWith("/api/flashcards");
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Nie udało się pobrać fiszek" }),
    } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Nie udało się pobrać fiszek");
    expect(result.current.flashcards).toEqual([]);
  });

  it("should update flashcard successfully", async () => {
    const updatedData = {
      id: "1",
      front: "Updated Front",
      back: "Updated Back",
      source: "MANUAL" as const,
      created_at: "2024-01-01T00:00:00Z",
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedData),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateFlashcard(updatedData);
    });

    const updatedFlashcard = result.current.flashcards.find((f) => f.id === "1");
    expect(updatedFlashcard).toBeDefined();
    expect(updatedFlashcard?.front).toBe("Updated Front");
    expect(updatedFlashcard?.back).toBe("Updated Back");
    expect(global.fetch).toHaveBeenCalledWith("/api/flashcards/1", expect.any(Object));
  });

  it("should delete flashcard successfully", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteFlashcard("1");
    });

    expect(result.current.flashcards).toHaveLength(1);
    expect(result.current.flashcards.find((f) => f.id === "1")).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/flashcards/1", {
      method: "DELETE",
    });
  });

  it("should handle update error", async () => {
    const errorMessage = "Nie udało się zaktualizować fiszki";
    const updatedData = {
      id: "1",
      front: "Updated Front",
      back: "Updated Back",
      source: "MANUAL" as const,
      created_at: "2024-01-01T00:00:00Z",
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      try {
        await result.current.updateFlashcard(updatedData);
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.flashcards).toEqual(mockFlashcards);
  });

  it("should handle delete error", async () => {
    const errorMessage = "Nie udało się usunąć fiszki";

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      try {
        await result.current.deleteFlashcard("1");
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.flashcards).toEqual(mockFlashcards);
  });

  it("should handle network timeout during delete operation", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockRejectedValueOnce(new Error("Network timeout"));

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      try {
        await result.current.deleteFlashcard("1");
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Network timeout");
    expect(result.current.flashcards).toEqual(mockFlashcards);
  });

  it("should handle server error during update operation", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      try {
        await result.current.updateFlashcard(mockFlashcards[0]);
      } catch {
        // Expected error
      }
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.flashcards).toEqual(mockFlashcards);
  });

  it("should handle concurrent operations correctly", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flashcards: mockFlashcards }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFlashcards[0]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

    const { result } = renderHook(() => useFlashcards());

    // Wait for the initial fetch from useEffect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await Promise.all([result.current.updateFlashcard(mockFlashcards[0]), result.current.deleteFlashcard("2")]);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.flashcards).toHaveLength(1);
    expect(result.current.flashcards[0]).toEqual(mockFlashcards[0]);
  });
});
