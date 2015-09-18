/*
* Author: Nguyen Vinh Nam
* All comments are warmly welcomed at nguyen.vinh.nam@spectos.com
* 
*/

var lineReader = require('line-reader');
var path = require('path');
var cmlArgs = ["1", "2", "3"];

var unigramG = {}; // global variables
var bigramG = {};
var trigramG = {};
var bigramSeriesG = {};
var trigramSeriesG = {};
var globalWordCount = 0;
var globalVarsLoaded = false;

if (cmlArgs.indexOf(process.argv[2]) >= 0){
  switch(process.argv[2]){
    case '1':
      console.log("Training file. Be patient! It gonna take a while (up to 15 mins) ... ");
      trigramModelCreator('brown','brown');
      trigramModelCreator('reuters','reuters');
      break;
    case '2':
      console.log("Perplexity Calculation started ... ");
      perplexityCalculation();
      break;
    case '3':
      console.log("Generating a sentence will be updated in my next version.");
      gerenateSentence();
      break;
  }
} else {
  console.log("Just pick the part you wanna do:");
  console.log("1. Create trigram Model \n" +
              "2. Load perplexity \n" +
              "3. sentence generator");
}

function perplexityCalculation(){
  if(!globalVarsLoaded){
    console.log("Loading trained Model ...");
    var fs = require('fs');
    unigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_unigram', 'utf8'));
    bigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_bigram', 'utf8'));
    trigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_trigram', 'utf8'));
    bigramSeriesG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_bigramSeries', 'utf8'));
    trigramSeriesG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_trigramSeries', 'utf8'));
    Object.keys(unigramG).forEach(function(key) {
      globalWordCount += unigramG[key];
    });   
    console.log("Model Loaded!");                    
  }  

  var lineReader = require('line-reader');
  var logProbability = 0;
  var totalWord = 0; // M in slide
  var sentenceTested = 0;
  console.log("Start calculate probability of each sentence in test file ...");
  lineReader.eachLine(__dirname +'/brown/brown'+'_test', function(line, last) {
    sentenceTested++;
    console.log("current process: "+ sentenceTested);
    line += ' STOP';
    probabilityObj = sentenceProbabilityCal(line); 
    logProbability += Math.log(probabilityObj['p']);    
    totalWord += probabilityObj['length'];
    if (last){ 
      l = logProbability / totalWord;
      perplexity = Math.pow(2, (-1 * l));
      console.log("************Report**************");
      console.log("total Available word in vocabulary: " + unigramG.length);
      console.log("total tested word: "+totalWord);
      console.log("total sentence tested: "+ sentenceTested);
      console.log("Perplexity at: " + perplexity);
      return false; // stop reading
    }
  });
}

function availableWordChecker( sentence, index){
  if (index < 0) return '*';
  if(unigramG[sentence[index]] == undefined) return "<UNK>";
  return sentence[index];
}
function sentenceProbabilityCal(sentence){
    sentence = sentence.split(' ');
    var sentenceProbality = 1;
    for (var i = 1; i < sentence.length +1; i++ ) {
      var word = availableWordChecker(sentence, (i-1) );
      var lastWord = availableWordChecker(sentence, (i-2) );
      var lastTwoWord = availableWordChecker(sentence, (i-3));
      sentenceProbality *= trigramSequence(lastTwoWord, lastWord , word);
    };
    return {"p" : sentenceProbality, "length":sentence.length};
}

function trigramSequence(lastTwoWord, lastWord, word){ // q (wi | w i-1 , w i-2)
  if(trigramSeriesG[lastTwoWord + ' ' + lastWord] == undefined) return 1; // not effect the others.
  if(trigramSeriesG[lastTwoWord + ' ' + lastWord].length > 0){
    if(trigramSeriesG[lastTwoWord + ' ' + lastWord].indexOf(word) > 0){
      q = (trigramG[lastTwoWord+ ' ' + lastWord + ' ' + word] - 0.5) / bigramG[lastTwoWord + ' ' +  lastWord];
    } else {
      var alpha = bigramAlpha (lastTwoWord, lastWord);
      var backOffWord = bigramSequence (lastWord, word);
      var totalBackOffTrigram = 0;

      trigramSeriesG[lastTwoWord +' '+ lastWord].forEach(function(key){
        totalBackOffTrigram += bigramSequence(lastWord, word);
      })
      q = alpha * (backOffWord / (1 - totalBackOffTrigram));
    }
  } else {
    q = bigramSequence(lastWord, word);
  }
  return q;
}    

function bigramSequence(lastWord, word){  // q (wi | w i-1 )
  if(bigramSeriesG[lastWord].length > 0){
    if(bigramSeriesG[lastWord].indexOf(word) > 0){
      q = (bigramG[lastWord+' '+ word] - 0.5) / unigramG[lastWord];
    }else{
      var alpha = unigramAlpha(lastWord);
      countStar = unigramG[word] || 1;
      totalConnectedWordInBigram = 0; // set A
      bigramSeriesG[lastWord].forEach(function(wi) {
        totalConnectedWordInBigram += unigramG[wi];
      });
      totalWordNotConnectedToLastWordBigram = globalWordCount - totalConnectedWordInBigram; // set B
      q = alpha * (countStar / totalWordNotConnectedToLastWordBigram );
    } 
  } else {
    q = unigramG[word] / globalWordCount;
  }
  return q;
}
    
function bigramAlpha(lastTwoWord, lastWord){
  return alpha = (0.5 * trigramSeriesG[lastTwoWord + ' ' + lastWord].length ) / 
        bigramG[lastTwoWord + ' ' + lastWord] || 0;
}

function unigramAlpha(lastWord){
  return alpha = (0.5 * bigramSeriesG[lastWord].length ) / unigramG[lastWord] || 0;
}

function gerenateSentence(){
  if(!globalVarsLoaded){
    var fs = require('fs');
    unigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_unigram', 'utf8'));
    bigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_bigram', 'utf8'));
    trigramG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_trigram', 'utf8'));
    bigramSeriesG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_bigramSeries', 'utf8'));
    trigramSeriesG = JSON.parse(fs.readFileSync(__dirname +'/brown/brown_trigramSeries', 'utf8'));
    globalVarsLoaded = true;
    Object.keys(unigramG).forEach(function(key) {
      globalWordCount += unigramG[key];
    });     
  }
}

function jsonToFile(trainingModel, trainingFile, jsonValue){
  fs = require('fs');
  fs.writeFile(path.join(__dirname,'/'+trainingModel + '/' + trainingModel+ '_' + trainingFile ), 
    jsonValue,{ flags: 'w+', defaultEncoding: 'utf8'}, function (err) {
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