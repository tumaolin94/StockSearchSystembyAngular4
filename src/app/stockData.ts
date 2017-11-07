export class StockData {
  stock_date: string;
  stock_array: number;
  constructor(date: string, array: number) {
    this.stock_date = date;
    this.stock_array = array;
  }
}
