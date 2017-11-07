export class Newsfeed {
  title: string;
  author: string;
  date: string;
  link: string;
  constructor(title: string, link: string, author: string, date: string) {
    this.title = title;
    this.link = link
    this.author = author;
    this.date = date;
  }
}
