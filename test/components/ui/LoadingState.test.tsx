import { render, screen } from "@testing-library/react";
import {
  ComponentLoadingState,
  LoadingState,
  PageLoadingState,
} from "@/components/ui/LoadingState";

describe("LoadingState", () => {
  it("应该渲染默认的 spinner 加载状态", () => {
    const { container } = render(<LoadingState />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("应该渲染不同大小的加载状态", () => {
    const { container: smContainer } = render(<LoadingState size="sm" />);
    const { container: mdContainer } = render(<LoadingState size="md" />);
    const { container: lgContainer } = render(<LoadingState size="lg" />);

    expect(smContainer.querySelector(".h-4.w-4")).toBeInTheDocument();
    expect(mdContainer.querySelector(".h-6.w-6")).toBeInTheDocument();
    expect(lgContainer.querySelector(".h-8.w-8")).toBeInTheDocument();
  });

  it("应该渲染 dots 变体", () => {
    const { container } = render(<LoadingState variant="dots" />);

    expect(container.querySelectorAll(".animate-bounce")).toHaveLength(3);
    expect(container).toMatchSnapshot();
  });

  it("应该显示自定义文本", () => {
    render(<LoadingState text="自定义加载文本" />);

    expect(screen.getByText("自定义加载文本")).toBeInTheDocument();
  });

  it("应该接受自定义类名", () => {
    const { container } = render(<LoadingState className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("PageLoadingState", () => {
  it("应该渲染页面级加载状态", () => {
    const { container } = render(<PageLoadingState />);

    expect(container.firstChild).toHaveClass("min-h-[400px]");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("ComponentLoadingState", () => {
  it("应该渲染组件级加载状态", () => {
    const { container } = render(<ComponentLoadingState />);

    expect(container.firstChild).toHaveClass("min-h-[100px]");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
