interface R<T> {
  code: number;
  msg: string;
  data: T;
}

export type Page<T> = {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
};

export interface Filter {
  id: string;
  value: any;
  op: string;
}

export interface Sort {
  id: string;
  desc: boolean;
}

export default R;
