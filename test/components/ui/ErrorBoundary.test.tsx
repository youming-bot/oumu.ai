import { render, screen } from "@testing-library/react";
import { act } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// 模拟 error-handler
jest.mock("@/lib/error-handler", () => ({
  handleError: jest.fn(),
  getLocalErrorLogs: jest.fn(() => []),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("应该正常渲染子组件", () => {
    const { container } = render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("正常内容")).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("应该在子组件出错时显示错误 UI", () => {
    const ErrorComponent = () => {
      throw new Error("测试错误");
    };

    const { container } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("出现了一个错误")).toBeInTheDocument();
    expect(screen.getByText(/应用程序遇到了一个意外错误/)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("应该提供重试功能", () => {
    let shouldThrow = true;
    const ErrorComponent = () => {
      if (shouldThrow) {
        throw new Error("测试错误");
      }
      return <div>恢复正常</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("出现了一个错误")).toBeInTheDocument();

    // 点击重试
    shouldThrow = false;
    const retryButton = screen.getByText("重试");

    act(() => {
      retryButton.click();
    });

    rerender(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("恢复正常")).toBeInTheDocument();
  });
});
