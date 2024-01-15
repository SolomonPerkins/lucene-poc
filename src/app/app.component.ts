import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http'
import * as lucene from 'node-lucene';

import favourite from './data/twitter_favourite_retweets.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lucene-poc';

  // books = [
  //   {
  //     content: 'The most merciful thing in the world, I think, is the inability of the human mind to correlate all its contents.',
  //     title: 'One Hundred Years of Solitude',
  //     author: 'Gabriel Garcia Marquez'
  //   },
  //   {
  //     content: 'It was a bright cold day in April, and the clocks were striking thirteen.',
  //     title: '1984',
  //     author: 'George Orwell'
  //   },
  //   {
  //     content: 'Happy families are all alike; every unhappy family is unhappy in its own way.',
  //     author: 'Leo Tolstoy',
  //     title: 'Anna Karenina'
  //   },
  //   {
  //     content: 'True! – nervous – very, very nervous I had been and am; but why will you say that I am mad?',
  //     author: 'Edgar Allan Poe',
  //     title: 'The Tell-Tale Heart'
  //   }
  // ];

  analyzer;
  writerConfig;
  writer;
  index;

  directory;
  searcher;
  parser;

  

  constructor(private httpClient : HttpClient) {
    lucene.initialize();

    this.analyzer = new lucene.analysis.standard.StandardAnalyzer();
    this.writerConfig = new lucene.index.IndexWriterConfig(this.analyzer);
    this.index = new lucene.store.RAMDirectory();
    this.writer = new lucene.index.IndexWriter(this.index, this.writerConfig);

    let phrase = "business";
    let syms = [];
    this.httpClient.get<Object>(`https://api.datamuse.com?rel_syn=${phrase}&max=10`).subscribe( (data: any[]) => {
      
      data.forEach(d => {
          if(d.score > 500) {
            syms.push(d.word);
          }
      });

      favourite.forEach( b => {
        const doc = new lucene.document.Document();

        doc.add(new lucene.document.TextField('text', b.text, lucene.document.FieldStore.YES));
        doc.add(new lucene.document.TextField("type", 'favourite', lucene.document.FieldStore.YES));
        // doc.add(new lucene.document.TextField("title", book.title, lucene.document.FieldStore.YES));
      
      });

      this.writer.close();

      this.directory = lucene.index.DirectoryReader.open(this.index);
      this.searcher = new lucene.search.IndexSearcher(this.directory);
      this.parser = new lucene.queryparser.classic.QueryParser('content', this.analyzer);

      let q = `${phrase} ${syms.join(" ")}`
      console.log(`Attempting to search for: `, q);
      let topDocs = this.searcher.search(this.parser.parse(q), 10);
      
      topDocs.scoreDocs.forEach(d => {
        let foundDoc = this.searcher.doc(d.doc);
        console.log(`Found DOC: ${foundDoc.get('type')} by ${foundDoc.get('title')}`);
      })

    });

  }
  
}
