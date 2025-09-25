import { URLManager } from "../../../src/lib/url-manager";

// Mock global URL object
const mockCreateObjectUrl = jest.fn();
const mockRevokeObjectUrl = jest.fn();

global.URL = {
  createObjectURL: mockCreateObjectUrl,
  revokeObjectURL: mockRevokeObjectUrl,
} as typeof URL;

describe("URLManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear active URLs between tests
    URLManager.revokeAllURLs();
    mockCreateObjectUrl.mockReturnValue("blob:mock-url-123");
  });

  afterEach(() => {
    // Clean up any remaining URLs
    URLManager.revokeAllURLs();
  });

  describe("createObjectURL", () => {
    it("should create and track object URL", () => {
      const blob = new Blob(["test"], { type: "text/plain" });

      const url = URLManager.createObjectURL(blob);

      expect(mockCreateObjectUrl).toHaveBeenCalledWith(blob);
      expect(url).toBe("blob:mock-url-123");
      expect(URLManager.getActiveUrlCount()).toBe(1);
    });

    it("should track multiple URLs", () => {
      const blob1 = new Blob(["test1"], { type: "text/plain" });
      const blob2 = new Blob(["test2"], { type: "text/plain" });

      mockCreateObjectUrl.mockReturnValueOnce("blob:url-1").mockReturnValueOnce("blob:url-2");

      const url1 = URLManager.createObjectURL(blob1);
      const url2 = URLManager.createObjectURL(blob2);

      expect(url1).toBe("blob:url-1");
      expect(url2).toBe("blob:url-2");
      expect(URLManager.getActiveUrlCount()).toBe(2);
    });
  });

  describe("revokeObjectURL", () => {
    it("should revoke tracked URL", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const url = URLManager.createObjectURL(blob);

      URLManager.revokeObjectURL(url);

      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should not revoke untracked URL", () => {
      const untrackedUrl = "blob:untracked-url";

      URLManager.revokeObjectURL(untrackedUrl);

      expect(mockRevokeObjectUrl).not.toHaveBeenCalled();
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should handle revoking already revoked URL", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const url = URLManager.createObjectURL(blob);

      // Revoke once
      URLManager.revokeObjectURL(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);

      // Revoke again - should not call URL.revokeObjectURL again
      jest.clearAllMocks();
      URLManager.revokeObjectURL(url);

      expect(mockRevokeObjectUrl).not.toHaveBeenCalled();
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });
  });

  describe("revokeAllURLs", () => {
    it("should revoke all tracked URLs", () => {
      const blob1 = new Blob(["test1"], { type: "text/plain" });
      const blob2 = new Blob(["test2"], { type: "text/plain" });
      const blob3 = new Blob(["test3"], { type: "text/plain" });

      mockCreateObjectUrl
        .mockReturnValueOnce("blob:url-1")
        .mockReturnValueOnce("blob:url-2")
        .mockReturnValueOnce("blob:url-3");

      URLManager.createObjectURL(blob1);
      URLManager.createObjectURL(blob2);
      URLManager.createObjectURL(blob3);

      expect(URLManager.getActiveUrlCount()).toBe(3);

      URLManager.revokeAllURLs();

      expect(mockRevokeObjectUrl).toHaveBeenCalledTimes(3);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith("blob:url-1");
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith("blob:url-2");
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith("blob:url-3");
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should handle empty URL list", () => {
      URLManager.revokeAllURLs();

      expect(mockRevokeObjectUrl).not.toHaveBeenCalled();
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });
  });

  describe("getActiveUrlCount", () => {
    it("should return correct count", () => {
      expect(URLManager.getActiveUrlCount()).toBe(0);

      const blob1 = new Blob(["test1"]);
      const blob2 = new Blob(["test2"]);

      mockCreateObjectUrl.mockReturnValueOnce("blob:url-1").mockReturnValueOnce("blob:url-2");

      URLManager.createObjectURL(blob1);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      URLManager.createObjectURL(blob2);
      expect(URLManager.getActiveUrlCount()).toBe(2);

      URLManager.revokeObjectURL("blob:url-1");
      expect(URLManager.getActiveUrlCount()).toBe(1);

      URLManager.revokeAllURLs();
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });
  });

  describe("createTemporaryURL", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should create temporary URL with default timeout", () => {
      const blob = new Blob(["test"], { type: "text/plain" });

      const url = URLManager.createTemporaryURL(blob);

      expect(url).toBe("blob:mock-url-123");
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward to just before default timeout (5 minutes)
      jest.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward past timeout
      jest.advanceTimersByTime(2);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should create temporary URL with custom timeout", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const customTimeout = 10000; // 10 seconds

      const url = URLManager.createTemporaryURL(blob, customTimeout);

      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward to just before custom timeout
      jest.advanceTimersByTime(customTimeout - 1);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward past timeout
      jest.advanceTimersByTime(2);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should handle multiple temporary URLs with different timeouts", () => {
      const blob1 = new Blob(["test1"]);
      const blob2 = new Blob(["test2"]);

      mockCreateObjectUrl
        .mockReturnValueOnce("blob:temp-url-1")
        .mockReturnValueOnce("blob:temp-url-2");

      const url1 = URLManager.createTemporaryURL(blob1, 5000); // 5 seconds
      const url2 = URLManager.createTemporaryURL(blob2, 10000); // 10 seconds

      expect(URLManager.getActiveUrlCount()).toBe(2);

      // Fast-forward 5 seconds - first URL should be revoked
      jest.advanceTimersByTime(5000);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url1);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward another 5 seconds - second URL should be revoked
      jest.advanceTimersByTime(5000);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url2);
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });

    it("should not affect manual revocation before timeout", () => {
      const blob = new Blob(["test"], { type: "text/plain" });

      const url = URLManager.createTemporaryURL(blob, 10000);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Manually revoke before timeout
      URLManager.revokeObjectURL(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);

      // Fast-forward past timeout - should not try to revoke again
      jest.clearAllMocks();
      jest.advanceTimersByTime(10000);
      expect(mockRevokeObjectUrl).not.toHaveBeenCalled();
    });

    it("should handle zero timeout", () => {
      const blob = new Blob(["test"], { type: "text/plain" });

      const url = URLManager.createTemporaryURL(blob, 0);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Fast-forward 0ms
      jest.advanceTimersByTime(0);
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith(url);
      expect(URLManager.getActiveUrlCount()).toBe(0);
    });
  });

  describe("integration scenarios", () => {
    it("should handle mixed regular and temporary URLs", () => {
      jest.useFakeTimers();

      const blob1 = new Blob(["regular"]);
      const blob2 = new Blob(["temporary"]);

      mockCreateObjectUrl
        .mockReturnValueOnce("blob:regular-url")
        .mockReturnValueOnce("blob:temp-url");

      const regularUrl = URLManager.createObjectURL(blob1);
      const _tempUrl = URLManager.createTemporaryURL(blob2, 5000);

      expect(URLManager.getActiveUrlCount()).toBe(2);

      // Fast-forward past temporary URL timeout
      jest.advanceTimersByTime(5000);
      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Regular URL should still be active
      URLManager.revokeObjectURL(regularUrl);
      expect(URLManager.getActiveUrlCount()).toBe(0);

      jest.useRealTimers();
    });

    it("should properly clean up when revokeAllURLs is called with pending timeouts", () => {
      jest.useFakeTimers();

      const blob = new Blob(["test"]);
      URLManager.createTemporaryURL(blob, 10000);

      expect(URLManager.getActiveUrlCount()).toBe(1);

      // Revoke all URLs before timeout
      URLManager.revokeAllURLs();
      expect(URLManager.getActiveUrlCount()).toBe(0);

      // Fast-forward past timeout - should not cause issues
      jest.clearAllMocks();
      jest.advanceTimersByTime(10000);
      expect(mockRevokeObjectUrl).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
