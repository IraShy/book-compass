const { decodeSearchParams } = require("../../src/middlewares/decodeTitle");

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

  it("should handle array title parameter by taking first value", () => {
    mockReq.query = { title: ["Book1", "Book2"] };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockReq.decodedTitle).toBe("Book1");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle array author parameter by taking first value", () => {
    mockReq.query = { title: "Book", author: ["Author1", "Author2"] };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockReq.decodedAuthor).toBe("Author1");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle malformed URI components", () => {
    mockReq.query = { title: "%ZZ" };

    decodeSearchParams(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Malformed search parameters",
    });
  });
});
