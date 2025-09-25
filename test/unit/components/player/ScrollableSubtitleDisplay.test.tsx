import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScrollableSubtitleDisplay from "@/components/player/ScrollableSubtitleDisplay";
import type { Segment } from "@/types/database";

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("ScrollableSubtitleDisplay", () => {
  const mockOnSegmentClick = jest.fn();
  const createSegment = (overrides: Partial<Segment> = {}): Segment => ({
    id: overrides.id ?? Math.random(),
    transcriptId: 1,
    start: overrides.start ?? 0,
    end: overrides.end ?? 5,
    text: overrides.text ?? "第一段字幕",
    translation: overrides.translation,
    wordTimestamps: overrides.wordTimestamps,
    furigana: overrides.furigana,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  });

  const baseSegments: Segment[] = [
    createSegment({ id: 1, start: 0, end: 5, text: "第一段字幕", translation: "First subtitle" }),
    createSegment({ id: 2, start: 5, end: 10, text: "第二段字幕", translation: "Second subtitle" }),
    createSegment({ id: 3, start: 10, end: 15, text: "第三段字幕", translation: "Third subtitle" }),
  ];

  beforeEach(() => {
    mockOnSegmentClick.mockClear();
    Element.prototype.scrollTo = jest.fn();
  });

  it("renders segments and translations", () => {
    render(
      <ScrollableSubtitleDisplay
        segments={baseSegments}
        currentTime={2}
        isPlaying
        onSegmentClick={mockOnSegmentClick}
      />,
    );

    expect(screen.getByText("第一段字幕")).toBeInTheDocument();
    expect(screen.getByText("Second subtitle")).toBeInTheDocument();
  });

  it("marks the active segment based on current time", () => {
    render(<ScrollableSubtitleDisplay segments={baseSegments} currentTime={6} isPlaying />);

    const cards = screen.getAllByTestId("subtitle-card");
    expect(cards[1]).toHaveAttribute("data-active", "true");
    expect(cards[0]).toHaveAttribute("data-active", "false");
  });

  it("invokes click callback when segment is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ScrollableSubtitleDisplay
        segments={baseSegments}
        currentTime={1}
        isPlaying
        onSegmentClick={mockOnSegmentClick}
      />,
    );

    const cards = screen.getAllByTestId("subtitle-card");
    await user.click(cards[0]);

    expect(mockOnSegmentClick).toHaveBeenCalledWith(baseSegments[0]);
  });

  it("auto-scrolls to keep the active segment in view", () => {
    const { rerender } = render(
      <ScrollableSubtitleDisplay segments={baseSegments} currentTime={2} isPlaying />,
    );

    const container = screen.getByTestId("subtitle-scroll-container");
    const activeCard = container.querySelector('[data-active="true"]') as HTMLElement;

    jest.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 200,
      height: 200,
      left: 0,
      right: 400,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    jest.spyOn(activeCard, "getBoundingClientRect").mockReturnValue({
      top: 500,
      bottom: 560,
      height: 60,
      left: 0,
      right: 400,
      width: 400,
      x: 0,
      y: 500,
      toJSON: () => ({}),
    } as DOMRect);

    rerender(<ScrollableSubtitleDisplay segments={baseSegments} currentTime={2.2} isPlaying />);

    expect(Element.prototype.scrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "smooth",
    });
  });

  it("supports custom class names", () => {
    render(
      <ScrollableSubtitleDisplay
        segments={baseSegments}
        currentTime={0}
        isPlaying
        className="custom-wrapper"
      />,
    );

    const container = screen.getByTestId("subtitle-scroll-container");
    expect(container).toHaveClass("custom-wrapper");
  });

  it("shows empty state when there are no segments", () => {
    render(<ScrollableSubtitleDisplay segments={[]} currentTime={0} isPlaying />);

    expect(screen.getByText("暂无字幕内容")).toBeInTheDocument();
  });

  it("renders per-word tokens when furigana data is provided", () => {
    const segmentsWithFurigana: Segment[] = [
      createSegment({
        id: 10,
        start: 0,
        end: 3,
        text: "テスト 字幕",
        furigana: JSON.stringify([
          { text: "テスト", reading: "てすと" },
          { text: "字幕", reading: "じまく" },
        ]),
        translation: "Test subtitle",
      }),
    ];

    render(<ScrollableSubtitleDisplay segments={segmentsWithFurigana} currentTime={1} isPlaying />);

    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.getByText("じまく", { selector: "rt" })).toBeInTheDocument();
  });
});
