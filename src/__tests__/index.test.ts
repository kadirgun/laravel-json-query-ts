import { createQuery, JsonQuery } from "../index";

test("create query", () => {
  const query = createQuery();
  query.where("id", ">", 10);

  const methods = query.getMethods();

  expect(methods).toEqual([{ name: "where", parameters: ["id", ">", 10] }]);
});

test("nested query", () => {
  const query = createQuery();
  query.where("id", ">", 10).with("user", (q) => {
    q.select("name").where("active", true);
  });

  const methods = query.getMethods();

  expect(methods).toEqual([
    { name: "where", parameters: ["id", ">", 10] },
    {
      name: "with",
      parameters: [
        "user",
        {
          methods: [
            { name: "select", parameters: ["name"] },
            { name: "where", parameters: ["active", true] },
          ],
        },
      ],
    },
  ]);
});

test("multiple relations", () => {
  const query = createQuery();

  query.with({
    user: (q) => {
      q.select("name").where("active", true);
    },
    posts: (q) => {
      q.select("title").where("published", true);
    },
  });

  const methods = query.getMethods();

  expect(methods).toEqual([
    {
      name: "with",
      parameters: [
        {
          user: {
            methods: [
              { name: "select", parameters: ["name"] },
              { name: "where", parameters: ["active", true] },
            ],
          },
          posts: {
            methods: [
              { name: "select", parameters: ["title"] },
              { name: "where", parameters: ["published", true] },
            ],
          },
        },
      ],
    },
  ]);

  console.log(methods);
});
