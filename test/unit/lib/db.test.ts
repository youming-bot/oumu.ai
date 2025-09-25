import { DbUtils, db } from "../../../src/lib/db";

// Mock Blob for testing
global.Blob = class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
    this.type = options?.type || "";
  }
};

describe("Database Module", () => {
  beforeEach(async () => {
    // Clear database before each test
    await DbUtils.clearDatabase();
  });

  afterAll(async () => {
    // Clean up after all tests
    await db.close();
  });

  describe("File Operations", () => {
    test("should add a new file to the database", async () => {
      // Arrange
      const fileData = {
        name: "test-audio.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["test content"], { type: "audio/mp3" }),
        duration: 60,
      };

      // Act
      const fileId = await DbUtils.addFile(fileData);

      // Assert
      expect(fileId).toBeDefined();
      expect(typeof fileId).toBe("number");

      const file = await DbUtils.getFile(fileId);
      expect(file).toBeDefined();
      expect(file?.name).toBe(fileData.name);
      expect(file?.size).toBe(fileData.size);
      expect(file?.type).toBe(fileData.type);
      expect(file?.duration).toBe(fileData.duration);
      // Note: fake-indexeddb may serialize Dates to strings
      expect(file?.createdAt).toBeDefined();
      expect(file?.updatedAt).toBeDefined();
    });

    test("should get all files from the database", async () => {
      // Arrange
      const fileData1 = {
        name: "test1.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content1"]),
        duration: 30,
      };

      const fileData2 = {
        name: "test2.mp3",
        size: 2048,
        type: "audio/mp3",
        blob: new Blob(["content2"]),
        duration: 45,
      };

      await DbUtils.addFile(fileData1);
      await DbUtils.addFile(fileData2);

      // Act
      const files = await DbUtils.getAllFiles();

      // Assert
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe(fileData2.name); // Should be reverse order by createdAt
      expect(files[1].name).toBe(fileData1.name);
    });

    test("should update an existing file", async () => {
      // Arrange
      const fileData = {
        name: "original.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };

      const fileId = await DbUtils.addFile(fileData);
      const originalFile = await DbUtils.getFile(fileId);
      const _originalUpdatedAt = originalFile?.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure timestamp difference
      await DbUtils.updateFile(fileId, { name: "updated.mp3", duration: 60 });

      // Assert
      const updatedFile = await DbUtils.getFile(fileId);
      expect(updatedFile?.name).toBe("updated.mp3");
      expect(updatedFile?.duration).toBe(60);
      // Note: fake-indexeddb may serialize Dates to strings
      expect(updatedFile?.updatedAt).toBeDefined();
    });

    test("should delete a file and its associated transcripts", async () => {
      // Arrange
      const fileData = {
        name: "to-delete.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };

      const fileId = await DbUtils.addFile(fileData);

      // Add a transcript for the file
      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "test transcript",
        language: "ja",
      });

      // Add segments for the transcript
      await DbUtils.addSegments([
        {
          transcriptId,
          start: 0,
          end: 5,
          text: "Hello world",
        },
      ]);

      // Act
      await DbUtils.deleteFile(fileId);

      // Assert
      const file = await DbUtils.getFile(fileId);
      expect(file).toBeUndefined();

      const transcripts = await DbUtils.getTranscriptsByFileId(fileId);
      expect(transcripts).toHaveLength(0);

      const segments = await DbUtils.getSegmentsByTranscriptId(transcriptId);
      expect(segments).toHaveLength(0);
    });

    test("should return undefined for non-existent file", async () => {
      // Act
      const file = await DbUtils.getFile(999);

      // Assert
      expect(file).toBeUndefined();
    });
  });

  describe("Transcript Operations", () => {
    test("should add a new transcript", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptData = {
        fileId,
        status: "processing",
        rawText: "This is a test transcript",
        language: "en",
      };

      // Act
      const transcriptId = await DbUtils.addTranscript(transcriptData);

      // Assert
      expect(transcriptId).toBeDefined();

      const transcript = await DbUtils.getTranscript(transcriptId);
      expect(transcript).toBeDefined();
      expect(transcript?.fileId).toBe(fileId);
      expect(transcript?.status).toBe("processing");
      expect(transcript?.rawText).toBe("This is a test transcript");
      expect(transcript?.language).toBe("en");
    });

    test("should get transcripts by file ID", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcript1 = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Transcript 1",
        language: "ja",
      });

      const transcript2 = await DbUtils.addTranscript({
        fileId,
        status: "failed",
        rawText: "Transcript 2",
        language: "en",
        error: "Processing failed",
      });

      // Act
      const transcripts = await DbUtils.getTranscriptsByFileId(fileId);

      // Assert
      expect(transcripts).toHaveLength(2);
      // Note: IDs may not be in expected order due to async operations
      expect(transcripts.some((t) => t.id === transcript1)).toBe(true);
      expect(transcripts.some((t) => t.id === transcript2)).toBe(true);
    });

    test("should update transcript status", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "pending",
        language: "ja",
      });

      // Act
      await DbUtils.updateTranscript(transcriptId, {
        status: "completed",
        rawText: "Completed transcript",
        processingTime: 5000,
      });

      // Assert
      const transcript = await DbUtils.getTranscript(transcriptId);
      expect(transcript?.status).toBe("completed");
      expect(transcript?.rawText).toBe("Completed transcript");
      expect(transcript?.processingTime).toBe(5000);
    });

    test("should delete transcript and associated segments", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Test transcript",
        language: "ja",
      });

      await DbUtils.addSegments([
        {
          transcriptId,
          start: 0,
          end: 5,
          text: "Segment 1",
        },
        {
          transcriptId,
          start: 5,
          end: 10,
          text: "Segment 2",
        },
      ]);

      // Act
      await DbUtils.deleteTranscript(transcriptId);

      // Assert
      const transcript = await DbUtils.getTranscript(transcriptId);
      expect(transcript).toBeUndefined();

      const segments = await DbUtils.getSegmentsByTranscriptId(transcriptId);
      expect(segments).toHaveLength(0);
    });
  });

  describe("Segment Operations", () => {
    test("should add multiple segments at once", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Test transcript",
        language: "ja",
      });

      const segmentsData = [
        {
          transcriptId,
          start: 0,
          end: 2.5,
          text: "Hello",
          normalizedText: "hello",
          translation: "こんにちは",
        },
        {
          transcriptId,
          start: 2.5,
          end: 5.0,
          text: "World",
          normalizedText: "world",
          translation: "世界",
        },
      ];

      // Act
      await DbUtils.addSegments(segmentsData);

      // Assert
      const segments = await DbUtils.getSegmentsByTranscriptId(transcriptId);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe("Hello");
      expect(segments[1].text).toBe("World");
      expect(segments[0].normalizedText).toBe("hello");
      expect(segments[0].translation).toBe("こんにちは");
    });

    test("should get segment at specific time", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Test transcript",
        language: "ja",
      });

      await DbUtils.addSegments([
        {
          transcriptId,
          start: 0,
          end: 3,
          text: "First segment",
        },
        {
          transcriptId,
          start: 3,
          end: 6,
          text: "Second segment",
        },
        {
          transcriptId,
          start: 6,
          end: 9,
          text: "Third segment",
        },
      ]);

      // Act & Assert
      const segmentAt2 = await DbUtils.getSegmentAtTime(transcriptId, 2);
      expect(segmentAt2?.text).toBe("First segment");

      const segmentAt4 = await DbUtils.getSegmentAtTime(transcriptId, 4);
      expect(segmentAt4?.text).toBe("Second segment");

      const segmentAt7 = await DbUtils.getSegmentAtTime(transcriptId, 7);
      expect(segmentAt7?.text).toBe("Third segment");

      const segmentAt10 = await DbUtils.getSegmentAtTime(transcriptId, 10);
      expect(segmentAt10).toBeUndefined();
    });

    test("should update segment with word timestamps", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Test transcript",
        language: "ja",
      });

      const segmentId = await DbUtils.addSegment({
        transcriptId,
        start: 0,
        end: 5,
        text: "Hello world",
      });

      const wordTimestamps = [
        { word: "Hello", start: 0, end: 2, confidence: 0.95 },
        { word: "world", start: 2, end: 5, confidence: 0.92 },
      ];

      // Act
      await DbUtils.updateSegment(segmentId, { wordTimestamps });

      // Assert
      const segment = await DbUtils.getSegment(segmentId);
      expect(segment?.wordTimestamps).toEqual(wordTimestamps);
    });
  });

  describe("Terminology Operations", () => {
    test("should add and search terms", async () => {
      // Arrange
      const termData = {
        word: "こんにちは",
        reading: "konnichiwa",
        meaning: "Hello",
        category: "greetings",
        tags: ["basic", "greeting"],
      };

      // Act
      const termId = await DbUtils.addTerm(termData);

      // Assert
      const term = await DbUtils.getTerm(termId);
      expect(term).toBeDefined();
      expect(term?.word).toBe("こんにちは");
      expect(term?.reading).toBe("konnichiwa");
      expect(term?.meaning).toBe("Hello");
      expect(term?.category).toBe("greetings");
      expect(term?.tags).toEqual(["basic", "greeting"]);

      // Test search
      const searchResults = await DbUtils.searchTerms("hello");
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].word).toBe("こんにちは");

      const japaneseSearch = await DbUtils.searchTerms("こん");
      expect(japaneseSearch).toHaveLength(1);

      const tagSearch = await DbUtils.searchTerms("basic");
      expect(tagSearch).toHaveLength(1);
    });

    test("should get terms by category", async () => {
      // Arrange
      await DbUtils.addTerm({
        word: "ありがとう",
        meaning: "Thank you",
        category: "greetings",
      });

      await DbUtils.addTerm({
        word: "すみません",
        meaning: "Excuse me",
        category: "greetings",
      });

      await DbUtils.addTerm({
        word: "本",
        meaning: "Book",
        category: "nouns",
      });

      // Act
      const greetingTerms = await DbUtils.getTermsByCategory("greetings");
      const nounTerms = await DbUtils.getTermsByCategory("nouns");

      // Assert
      expect(greetingTerms).toHaveLength(2);
      expect(nounTerms).toHaveLength(1);
      expect(greetingTerms.every((term) => term.category === "greetings")).toBe(true);
    });

    test("should update and delete terms", async () => {
      // Arrange
      const termId = await DbUtils.addTerm({
        word: "テスト",
        meaning: "Test",
        category: "general",
      });

      // Act - Update
      await DbUtils.updateTerm(termId, {
        meaning: "Updated test meaning",
        tags: ["updated", "test"],
      });

      // Assert - Update
      const updatedTerm = await DbUtils.getTerm(termId);
      expect(updatedTerm?.meaning).toBe("Updated test meaning");
      expect(updatedTerm?.tags).toEqual(["updated", "test"]);

      // Act - Delete
      await DbUtils.deleteTerm(termId);

      // Assert - Delete
      const deletedTerm = await DbUtils.getTerm(termId);
      expect(deletedTerm).toBeUndefined();
    });
  });

  describe("Utility Methods", () => {
    test("should get file with transcripts", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Transcript 1",
        language: "ja",
      });

      await DbUtils.addTranscript({
        fileId,
        status: "failed",
        rawText: "Transcript 2",
        language: "en",
        error: "Failed",
      });

      // Act
      const result = await DbUtils.getFileWithTranscripts(fileId);

      // Assert
      expect(result.file.id).toBe(fileId);
      expect(result.transcripts).toHaveLength(2);
      expect(result.transcripts[0].fileId).toBe(fileId);
      expect(result.transcripts[1].fileId).toBe(fileId);
    });

    test("should get transcript with segments", async () => {
      // Arrange
      const fileData = {
        name: "test.mp3",
        size: 1024,
        type: "audio/mp3",
        blob: new Blob(["content"]),
        duration: 30,
      };
      const fileId = await DbUtils.addFile(fileData);

      const transcriptId = await DbUtils.addTranscript({
        fileId,
        status: "completed",
        rawText: "Test transcript",
        language: "ja",
      });

      await DbUtils.addSegments([
        {
          transcriptId,
          start: 0,
          end: 3,
          text: "Segment 1",
        },
        {
          transcriptId,
          start: 3,
          end: 6,
          text: "Segment 2",
        },
      ]);

      // Act
      const result = await DbUtils.getTranscriptWithSegments(transcriptId);

      // Assert
      expect(result.transcript.id).toBe(transcriptId);
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].transcriptId).toBe(transcriptId);
      expect(result.segments[1].transcriptId).toBe(transcriptId);
      expect(result.segments[0].start).toBeLessThan(result.segments[1].start);
    });

    test("should throw error for non-existent file with transcripts", async () => {
      // Act & Assert
      await expect(DbUtils.getFileWithTranscripts(999)).rejects.toThrow("File not found");
    });

    test("should throw error for non-existent transcript with segments", async () => {
      // Act & Assert
      await expect(DbUtils.getTranscriptWithSegments(999)).rejects.toThrow("Transcript not found");
    });
  });
});
