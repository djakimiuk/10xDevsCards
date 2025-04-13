import { renderHook, act } from "@testing-library/react";
import { useGenerationProcess } from "../hooks/useGenerationProcess";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useGenerationProcess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useGenerationProcess());

    expect(result.current.sourceText).toBe("");
    expect(result.current.validationError).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isBulkSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.candidates).toEqual([]);
  });

  it("validates source text length", () => {
    const { result } = renderHook(() => useGenerationProcess());

    act(() => {
      result.current.setSourceText("too short");
    });

    expect(result.current.sourceText).toBe("too short");

    act(() => {
      result.current.startGeneration();
    });

    expect(result.current.validationError).toBe("Text must be at least 1000 characters long");
  });

  it("starts generation process successfully", async () => {
    const mockResponse = {
      id: "123",
      source_text: "valid text".repeat(100),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ aiCandidates: [] }),
        })
      );

    const { result } = renderHook(() => useGenerationProcess());

    act(() => {
      result.current.setSourceText("valid text".repeat(100)); // 1000+ znaków
    });

    await act(async () => {
      await result.current.startGeneration();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/generation-requests", expect.any(Object));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles generation error", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Invalid request" }),
      })
    );

    const { result } = renderHook(() => useGenerationProcess());

    act(() => {
      result.current.setSourceText("valid text".repeat(100));
    });

    await act(async () => {
      await result.current.startGeneration();
    });

    expect(result.current.error).toBe("Invalid request data.");
    expect(result.current.isLoading).toBe(false);
  });

  it("marks candidate for acceptance", () => {
    const { result } = renderHook(() => useGenerationProcess());

    const mockCandidate = {
      id: "1",
      requestId: "req1",
      front: "front",
      back: "back",
      createdAt: new Date().toISOString(),
      uiState: "idle" as const,
    };

    act(() => {
      // Ustawiamy kandydata w stanie
      result.current.candidates = [mockCandidate];
      // Oznaczamy do akceptacji
      result.current.markForAcceptance("1");
    });

    expect(result.current.candidates[0].uiState).toBe("marked_for_acceptance");
  });

  it("marks candidate for rejection", () => {
    const { result } = renderHook(() => useGenerationProcess());

    const mockCandidate = {
      id: "1",
      requestId: "req1",
      front: "front",
      back: "back",
      createdAt: new Date().toISOString(),
      uiState: "idle" as const,
    };

    act(() => {
      // Ustawiamy kandydata w stanie
      result.current.candidates = [mockCandidate];
      // Oznaczamy do odrzucenia
      result.current.markForRejection("1");
    });

    expect(result.current.candidates[0].uiState).toBe("marked_for_rejection");
  });

  it("saves all marked candidates", async () => {
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "1" }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        })
      );

    const { result } = renderHook(() => useGenerationProcess());

    const mockCandidates = [
      {
        id: "1",
        requestId: "req1",
        front: "front1",
        back: "back1",
        createdAt: new Date().toISOString(),
        uiState: "marked_for_acceptance" as const,
      },
      {
        id: "2",
        requestId: "req1",
        front: "front2",
        back: "back2",
        createdAt: new Date().toISOString(),
        uiState: "marked_for_rejection" as const,
      },
    ];

    act(() => {
      result.current.candidates = mockCandidates;
    });

    await act(async () => {
      await result.current.saveAllMarkedCandidates();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.candidates[0].uiState).toBe("saved");
    expect(result.current.candidates[1].uiState).toBe("rejected");
  });

  it("handles bulk save errors", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useGenerationProcess());

    const mockCandidates = [
      {
        id: "1",
        requestId: "req1",
        front: "front1",
        back: "back1",
        createdAt: new Date().toISOString(),
        uiState: "marked_for_acceptance" as const,
      },
    ];

    act(() => {
      result.current.candidates = mockCandidates;
    });

    await act(async () => {
      await result.current.saveAllMarkedCandidates();
    });

    expect(result.current.error).toBe("Some flashcards failed to save. Please check individual cards for details.");
    expect(result.current.candidates[0].uiState).toBe("error");
  });
});
