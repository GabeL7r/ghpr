const Template = require('../src/Template.js');

describe("Template", () => {
  test("is instatiated correctly", () => {
      const template = new Template('.github/pull_request_template.md', '/home/gabe/CodeSherpas/ghpr')
    expect(typeof template).toBe("object");
  });
});
