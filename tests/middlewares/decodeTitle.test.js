const { decodeSearchParams } = require("../../src/middlewares/bookParams");

describe("decodeSearchParams middleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      log: { debug: jest.fn(), error: jest.fn() },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should handle malformed URI components", () => {
    mockReq.query = { title: "%ZZ", authors: "Author" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Malformed search parameters",
    });
  });

  it("should decode title and authors successfully", () => {
    mockReq.query = { title: "The%20Master", authors: "Mikhail%20Bulgakov" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockReq.decodedTitle).toBe("The Master");
    expect(mockReq.decodedAuthors).toEqual(["Mikhail Bulgakov"]);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should parse comma-separated authors", () => {
    mockReq.query = { title: "Good Omens", authors: "Terry%20Pratchett%2C%20Neil%20Gaiman" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockReq.decodedTitle).toBe("Good Omens");
    expect(mockReq.decodedAuthors).toEqual(["Terry Pratchett", "Neil Gaiman"]);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should return 400 when title is missing", () => {
    mockReq.query = { authors: "Author" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Title is required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 400 when authors is missing", () => {
    mockReq.query = { title: "Book" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "At least one author is required" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 400 when authors is empty after filtering", () => {
    mockReq.query = { title: "Book", authors: "   ,  , " };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "At least one valid author is required" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
