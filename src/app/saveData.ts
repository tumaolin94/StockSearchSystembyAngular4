export class SaveData {
  save_name: String;
  save_price: number;
  save_change: number;
  save_change_per: number;
  save_volume: number;
  save_new_volume: string;
  save_time: string;
  constructor(name: string, price: number, change: number, change_per: number, volume: number, time: string) {
    this.save_change = change;
    this.save_name = name;
    this.save_price = price;
    this.save_change_per = change_per;
    this.save_volume = volume;
    this.save_time = time;
    this.save_new_volume = volume.toString().replace(/\B(?=(?:\d{3})+\b)/g, ',');
  }
}
