// Debug test for FileList import in Jest environment
describe("FileList Import Debug", () => {
  it("should import FileList component", () => {
    const FileList = require("@/components/file-list.tsx").default;

    expect(FileList).toBeDefined();
    expect(typeof FileList).toBe("function");
  });
});
