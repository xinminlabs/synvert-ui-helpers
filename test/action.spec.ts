import path from "path";
import fs from "fs/promises";
import mock from "mock-fs";

import { replaceTestResult, replaceTestAction } from '../src/action';

describe("replaceTestResult", () => {
  afterEach(() => {
    mock.restore();
  });

  it("replaces the result", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 5,
        end: 6,
        newCode: "--"
      }, {
        type: "group",
        start: 0,
        end: 11,
        actions: [{
          type: "replace",
          start: 0,
          end: 5,
          newCode: "hi"
        }, {
          type: "replace",
          start: 6,
          end: 11,
          newCode: "foo"
        }]
      }]
    };
    const results = await replaceTestResult([result], 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("hi--foo");
  });

  it("replaces the result for add_file", async () => {
    mock({ "/root": {} });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "add_file",
        start: 0,
        end: 0,
        newCode: "class ApplicationRecord; end"
      }]
    }
    const results = await replaceTestResult([result], 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("class ApplicationRecord; end");
  });

  it("replaces the result for remove_file", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "remove_file",
        start: 0,
        end: -1,
      }]
    }
    const results = await replaceTestResult([result], 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.access("/root/foo.ts").then(() => true).catch(() => false)).toBeFalsy();
  });

  it("replaces the result for rename_file", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      newFilePath: "bar.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "rename_file",
        start: 0,
        end: -1,
      }]
    }
    const results = await replaceTestResult([result], 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.access("/root/foo.ts").then(() => true).catch(() => false)).toBeFalsy();
    expect(await fs.readFile("/root/bar.ts", "utf8")).toEqual("hello world");
  });
});

describe("replaceResultAction", () => {
  afterEach(() => {
    mock.restore();
  });

  it("replaces only result and action", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      rootPath: "/root",
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 0,
        end: 5,
        newCode: "hi"
      }]
    };
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("hi world");
  });

  it("replaces the action", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 0,
        end: 5,
        newCode: "hi"
      }, {
        type: "replace",
        start: 6,
        end: 11,
        newCode: "foo"
      }]
    };
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([{
      fileSource: "hi world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 3,
        end: 8,
        newCode: "foo"
      }]
    }])
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("hi world");
  });

  it("replaces the action when result contains group action", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 5,
        end: 6,
        newCode: "--"
      }, {
        type: "group",
        start: 0,
        end: 11,
        actions: [{
          type: "replace",
          start: 0,
          end: 5,
          newCode: "hi"
        }, {
          type: "replace",
          start: 6,
          end: 11,
          newCode: "foo"
        }]
      }]
    };
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([{
      fileSource: "hello--world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "group",
        start: 0,
        end: 12,
        actions: [{
          type: "replace",
          start: 0,
          end: 5,
          newCode: "hi"
        }, {
          type: "replace",
          start: 7,
          end: 12,
          newCode: "foo"
        }]
      }]
    }]);
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("hello--world");
  });

  it("replaces the group action", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      fileSource: "hello world",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 5,
        end: 6,
        newCode: "--"
      }, {
        type: "group",
        start: 0,
        end: 11,
        actions: [{
          type: "replace",
          start: 0,
          end: 5,
          newCode: "hi"
        }, {
          type: "replace",
          start: 6,
          end: 11,
          newCode: "foo"
        }]
      }]
    };
    const results = await replaceTestAction([result], 0, 1, "/root", path, fs);
    expect(results).toEqual([{
      fileSource: "hi foo",
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "replace",
        start: 2,
        end: 3,
        newCode: "--"
      }]
    }]);
    expect(await fs.readFile("/root/foo.ts", "utf-8")).toEqual("hi foo");
  });

  it("replaces the action for add_file", async () => {
    mock({ "/root": {} });
    const result = {
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "add_file",
        start: 0,
        end: 0,
        newCode: "class ApplicationRecord; end"
      }]
    }
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.readFile("/root/foo.ts", "utf8")).toEqual("class ApplicationRecord; end");
  });

  it("replaces the result for remove_file", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      filePath: "foo.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "remove_file",
        start: 0,
        end: -1,
      }]
    }
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.access("/root/foo.ts").then(() => true).catch(() => false)).toBeFalsy();
  });

  it("replaces the result for rename_file", async () => {
    mock({ "/root/foo.ts": "hello world" });
    const result = {
      filePath: "foo.ts",
      newFilePath: "bar.ts",
      affected: true,
      conflicted: false,
      actions: [{
        type: "rename_file",
        start: 0,
        end: -1,
      }]
    }
    const results = await replaceTestAction([result], 0, 0, "/root", path, fs);
    expect(results).toEqual([]);
    expect(await fs.access("/root/foo.ts").then(() => true).catch(() => false)).toBeFalsy();
    expect(await fs.readFile("/root/bar.ts", "utf8")).toEqual("hello world");
  });
});