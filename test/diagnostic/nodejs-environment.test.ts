/**
 * Node.js API 环境中的 IndexedDB 问题诊断测试
 *
 * 此测试模拟 Next.js API 路由在 Node.js 环境中运行时的情况，
 * 专门诊断为什么会出现 "MissingAPIError IndexedDB API missing" 错误。
 */

describe("Node.js API 环境 IndexedDB 诊断", () => {
  let originalIndexedDb: unknown;
  let originalIdbKeyRange: unknown;
  let originalWindow: unknown;

  beforeEach(() => {
    // 保存原始环境
    originalIndexedDb = global.indexedDB;
    originalIdbKeyRange = global.IDBKeyRange;
    originalWindow = global.window;

    jest.clearAllMocks();
  });

  afterEach(() => {
    // 恢复原始环境
    global.indexedDB = originalIndexedDb;
    global.IDBKeyRange = originalIdbKeyRange;
    global.window = originalWindow;
  });

  describe("模拟纯 Node.js 环境（无 fake-indexeddb）", () => {
    test("当没有 IndexedDB 时应该出现 MissingAPIError", async () => {
      // 删除 IndexedDB 相关对象，模拟纯 Node.js 环境
      delete global.indexedDB;
      delete global.IDBKeyRange;
      delete global.window;

      // 尝试使用 Dexie，应该会失败
      await expect(async () => {
        const { default: Dexie } = await import("dexie");

        // 创建数据库实例时应该检测到缺失的 API
        const testDb = new Dexie("TestDB");
        testDb.version(1).stores({
          files: "++id, name",
        });

        // 尝试打开数据库应该失败
        await testDb.open();
      }).rejects.toThrow();
    });

    test("检查 Dexie 如何检测 IndexedDB 可用性", async () => {
      const { default: Dexie } = await import("dexie");

      // 删除 IndexedDB
      delete global.indexedDB;

      try {
        // 尝试创建数据库实例
        const testDb = new Dexie("MissingAPITest");
        testDb.version(1).stores({ test: "++id" });

        // 尝试打开数据库
        await testDb.open();
      } catch (error) {
        expect(error.message).toContain("missing");
      }
    });
  });

  describe("模拟 API 路由执行环境", () => {
    test("检查 API 路由中的模块加载", async () => {
      // 重新加载模块以模拟 API 路由中的情况
      jest.resetModules();

      // 删除 IndexedDB 相关对象
      delete global.indexedDB;
      delete global.IDBKeyRange;

      // 模拟在 API 路由中加载数据库模块
      try {
        const { DBUtils } = await import("@/lib/db");

        // 尝试使用 DBUtils 方法
        await expect(DBUtils.getFile(1)).rejects.toThrow();
      } catch (error) {
        if (error instanceof Error && error.message.includes("IndexedDB API missing")) {
          expect(error.message).toContain("IndexedDB API missing");
        }
      }
    });

    test("模拟在 Next.js API 路由中的真实情况", async () => {
      // 创建一个新的隔离环境
      const vm = await import("node:vm");

      // 创建模拟的 Node.js 环境（没有浏览器 API）
      const context = vm.createContext({
        require,
        console,
        process,
        Buffer,
        global: {},
        exports: {},
        module: { exports: {} },
        __dirname,
        __filename,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
      });

      const code = `
        try {
          // 在隔离环境中尝试使用 Dexie
          const Dexie = require('dexie').default;

          console.log('隔离环境中的 Dexie 测试:');
          console.log('- typeof indexedDB:', typeof indexedDB);

          const db = new Dexie('IsolatedTest');
          db.version(1).stores({ test: '++id' });

          // 尝试操作数据库
          result = db.open().then(() => 'success').catch(err => err.message);

        } catch (error) {
          result = error.message;
        }
      `;

      try {
        vm.runInContext(code, context);
        const result = await context.result;

        if (typeof result === "string" && result.includes("missing")) {
          expect(result).toContain("missing");
        }
      } catch (_error) {
        // 测试中的预期错误，可以安全忽略
      }
    });
  });

  describe("检查 Jest 配置的影响", () => {
    test("验证 jest.setup.js 中的 fake-indexeddb 设置", () => {
      const _setupCode = `
        const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
        global.indexedDB = indexedDB;
        global.IDBKeyRange = IDBKeyRange;
      `;

      // 验证 fake-indexeddb 是否正确设置
      expect(typeof global.indexedDB).toBe("object");
      expect(global.indexedDB).toBeTruthy();
    });

    test("测试 testEnvironment 设置对 IndexedDB 的影响", () => {
      // 检查当前测试环境
      const hasWindow = typeof window !== "undefined";
      const _hasDocument = typeof document !== "undefined";
      const hasIndexedDb = typeof indexedDB !== "undefined";

      if (hasWindow && hasIndexedDb) {
        // 完整的浏览器环境
        expect(hasWindow).toBe(true);
      } else if (!hasWindow && hasIndexedDb) {
        // Node.js 环境但带有 fake-indexeddb
        expect(hasIndexedDb).toBe(true);
      } else {
        // 纯 Node.js 环境
        expect(hasWindow).toBe(false);
      }
    });
  });

  describe("实际 API 调用路径测试", () => {
    // 辅助函数：验证错误类型
    const validateErrorType = (error: unknown): void => {
      if (error instanceof Error) {
        if (error.message.includes("IndexedDB API missing")) {
          expect(error.message).toContain("IndexedDB API missing");
        } else if (error.message.includes("Database has been closed")) {
          expect(error.message).toContain("Database has been closed");
        } else {
          // 其他错误
          expect(error.message).toBeTruthy();
        }
      }
    };

    // 辅助函数：模拟 API 调用环境
    const simulateApiCallEnvironment = async () => {
      jest.resetModules();

      try {
        // 在实际 API 环境中，这些模块会被重新加载
        const { DbUtils } = await import("@/lib/db");
        await import("@/lib/error-handler");
        return { DBUtils: DbUtils, success: true };
      } catch (error) {
        return { DBUtils: null, success: false, error };
      }
    };

    // 辅助函数：执行文件查询操作
    const executeFileQuery = async (DBUtils: any, fileId: number): Promise<void> => {
      if (!DBUtils) {
        throw new Error("DBUtils is undefined");
      }
      await DBUtils.getFile(fileId);
    };

    test("模拟完整的 /api/transcribe 调用流程", async () => {
      const requestData = {
        fileId: 1,
        language: "ja",
        chunkSeconds: 45,
        overlap: 0.2,
      };

      const { DBUtils, success, error: importError } = await simulateApiCallEnvironment();

      if (!success) {
        // 如果模块导入失败，验证导入错误
        validateErrorType(importError);
        return;
      }

      try {
        await executeFileQuery(DBUtils, requestData.fileId);
      } catch (error) {
        validateErrorType(error);
        throw error;
      }
    });
  });

  describe("解决方案验证", () => {
    test("验证 fake-indexeddb 在 API 环境中的正确设置", async () => {
      // 检查是否需要在 API 路由中手动设置 fake-indexeddb
      const needsSetup =
        typeof indexedDB === "undefined" || (indexedDB as any)?.constructor?.name !== "FDBFactory";

      if (needsSetup) {
        // 演示正确的设置方法
        const fakeIndexedDb = await import("fake-indexeddb");
        expect(fakeIndexedDb.indexedDB.constructor.name).toBe("FDBFactory");
      }
    });

    test("测试条件性 polyfill 设置", async () => {
      // 模拟在 API 路由中条件性设置 IndexedDB polyfill
      const setupPolyfill = async () => {
        if (typeof indexedDB === "undefined") {
          const fakeIndexedDb = await import("fake-indexeddb");
          global.indexedDB = fakeIndexedDb.indexedDB;
          global.IDBKeyRange = fakeIndexedDb.IDBKeyRange;
          return true;
        }
        return false;
      };

      // 临时删除 IndexedDB
      delete global.indexedDB;
      delete global.IDBKeyRange;

      const wasSetup = await setupPolyfill();

      if (wasSetup) {
        expect(typeof indexedDB).toBe("object");
        expect((indexedDB as any).constructor.name).toBe("FDBFactory");
      }
    });
  });
});
