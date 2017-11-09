export class SaveData {
  save_name: String;
  save_price: string;
  save_change: string;
  save_change_per: string;
  save_volume: string;
  constructor(name: string, price: string, change: string, change_per: string, volume: string) {
    this.save_change = change;
    this.save_name = name;
    this.save_price = price;
    this.save_change_per = change_per;
    this.save_volume = volume;
  }
}
