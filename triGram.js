/*
* Author: Nguyen Vinh Nam
* All comments are warmly welcomed at nguyen.vinh.nam@spectos.com
* 
*/

var lineReader = require('line-reader');
var path = require('path');
var cmlArgs = ["1", "2", "3"];
if (cmlArgs.indexOf(process.argv[2]) >= 0){
  switch(process.argv[2]){
    case '1':
      console.log("Training file. Be patient! It gonna take a while (up to 15 mins) ... ");
      trigramModelCreator('brown','brown');
      trigramModelCreator('reuters','reuters');
      break;
    case '2':
      console.log("Calculating perplexity ... ");
      break;
    case '3':
      console.log("Generating a sentence... ");
      gerenateSentence();
      break;
  }
} else {
  console.log("Just pick the part you wanna do:");
  console.log("1. Create trigram Model \n" +
              "2. Load perplexity \n" +
              "3. sentence generator");
}

function gerenateSentence(){
  var fs = require('fs');
  var trigram = fs.readFileSync(__dirname +'/brown/brown_trigram', 'utf8');
  trigram = JSON.parse(trigram);
  console.log(trigram);
}

function jsonToFile(trainingModel, trainingFile, jsonValue){
  fs = require('fs');
  fs.writeFile(path.join(__dirname,'/'+trainingModel + '/' + trainingModel+ '_' + trainingFile ), jsonValue,{ flags: 'w+',
              defaultEncoding: 'utf8'}, function (err) {
    if (err) return console.log(err);
    console.log('Done writing, you can check it out at:');

    console.log(path.join(__dirname,'/'+trainingModel + '/' + trainingModel+ '_' + trainingFile ));
  });
}

function trigramModelCreator(trainingModel, trainingFile) {

  var totalWord = 0;
  var currentProcess = 0;
  var unigram = {};
  var bigram = {};
  var trigram = {};
  var bigramSeries = {};
  var trigramSeries = {};

  lineReader.eachLine(path.join(__dirname,'/'+trainingModel+'/'+trainingFile ), function(line) {
    currentProcess++;
    line = line.toLowerCase() + " STOP";
    var lastTwoWord = '*';
    var lastWord = '*';  

    unigram[lastTwoWord] = unigram[lastTwoWord] + 2 || 2;
    bigram[lastTwoWord + ' ' + lastWord] = bigram[lastTwoWord + ' ' + lastWord] + 1 || 1;
    if (!bigramSeries[lastTwoWord]) bigramSeries[lastTwoWord] =[];
    if(bigramSeries[lastTwoWord].indexOf(lastWord) < 0){
      bigramSeries[lastTwoWord].push(lastWord);
    }
    line.split(" ").forEach(function(word) {
      totalWord++;
      unigram[word] = unigram[word] + 1 || 1;
      bigram[lastWord + ' ' + word] = bigram[lastWord+' '+word] + 1 || 1;
      trigram[lastTwoWord + ' ' + lastWord + ' ' + word]  = 
        trigram[lastTwoWord + ' ' + lastWord + ' ' + word] + 1 || 1;
      if(!bigramSeries[lastWord]) bigramSeries[lastWord] = [];  
      if(bigramSeries[lastWord].indexOf(word) < 0){
        bigramSeries[lastWord].push(word);
      }
      if(!trigramSeries[lastTwoWord + ' ' + lastWord]) trigramSeries[lastTwoWord + ' ' + lastWord] = [];
      if(trigramSeries[lastTwoWord + ' ' + lastWord].indexOf(word) < 0){
        trigramSeries[lastTwoWord + ' ' + lastWord].push(word);
      }
      lastTwoWord = lastWord;
      lastWord = word;
    });
    unigram["<UNK>"] = Object.keys(unigram).length;

    console.log(currentProcess + " sentence trained");
  }).then(function (err) {
    if (err) throw err;
    console.log(trainingModel + "-training DONE!!");
    console.log('*****');
    unigram = JSON.stringify(unigram);
    jsonToFile(trainingModel, 'unigram', unigram);

    bigram = JSON.stringify(bigram);
    jsonToFile(trainingModel, 'bigram', bigram);

    trigram = JSON.stringify(trigram);
    jsonToFile(trainingModel, 'trigram', trigram);

    bigramSeries = JSON.stringify(bigramSeries);
    jsonToFile(trainingModel, 'bigramSeries', bigramSeries);

    trigramSeries = JSON.stringify(trigramSeries);
    jsonToFile(trainingModel, 'trigramSeries', trigramSeries);
  });  
}