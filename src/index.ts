type TQueryMethodParameter = string | JsonQuery[] | (unknown & {});

type TQueryMethodName = "select" | "where" | "with" | "orderBy" | "paginate" | "groupBy" | "having";

type TQueryMethod = {
  name: TQueryMethodName;
  parameters?: TQueryMethodParameter[];
};

export type TQueryParameterMethod<T extends string = TQueryMethodName> = (query: TJsonQuery<T>) => void;

type TQueryMethodArg<T extends string = TQueryMethodName> =
  | TQueryMethodParameter
  | TQueryParameterMethod<T>
  | Record<string, TQueryParameterMethod<T>>;

export type TJsonQuery<T extends string = TQueryMethodName> = {
  [K in T]: (...args: TQueryMethodArg<T>[]) => TJsonQuery<T>;
} & {
  getMethods: () => TQueryMethod[];
  build: () => TQuery;
};

export type TQuery = {
  methods: TQueryMethod[];
};

export class JsonQuery {
  private methods: TQueryMethod[] = [];

  constructor() {
    this.methods = [];
  }

  addMethod(name: TQueryMethodName, parameters?: TQueryMethodParameter[]) {
    this.methods.push({ name, parameters });
    return this;
  }

  getMethods(): TQueryMethod[] {
    return this.methods;
  }

  build(): TQuery {
    return {
      methods: this.methods,
    };
  }
}

const convertFunctionToQuery = (fn: TQueryParameterMethod): TQuery => {
  const nestedQuery = createQuery();
  fn(nestedQuery);
  return nestedQuery.build();
};

const parseArg = (arg: TQueryMethodArg): TQueryMethodParameter => {
  if (typeof arg === "function") {
    return convertFunctionToQuery(arg as TQueryParameterMethod);
  } else if (typeof arg === "object" && !Array.isArray(arg)) {
    return Object.fromEntries(
      Object.entries(arg).map(([key, value]) => {
        return [key, parseArg(value)];
      })
    );
  } else if (Array.isArray(arg)) {
    return arg.map(parseArg);
  }

  return arg;
};

export function createQuery<T extends string = TQueryMethodName>() {
  const instance = new JsonQuery();
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (!(prop in target)) {
        return function (...args: TQueryMethodArg[]) {
          target.addMethod(prop as TQueryMethodName, args.map(parseArg));
          return receiver;
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as TJsonQuery<T>;
}
