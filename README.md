# language Modeling
-------
This is a small project I started while learning Text Mining. 
It has no real purpose other than educational.
The idea of is to train two corpora (Brown and Reuter) into NGram Model (triGram in particular) using Katz back-off smoothing technique.

#Usage
-------
Since i choose Nodejs for this project, you have to install it in order to make it runable:

  `apt-get install nodejs`

change your directory to my repository:

  `cd path_to_my_project`

Here we go:

  `node triGram.js`

Then follow the instruction with appropriate parameters.

To train the model again: 

  `node triGram.js 1`

To re-calculate the perlexity:

  `node triGram.js 2`

To generate sentence, use the command below:

  `node triGram.js 3`

But you probably have to pick two random word in provided dictionary, for ex:

  `node triGram.js 3 the dog`  

#TODO: 
-------
Performance is a serious problem here. Does anyone know how to improve the look-up mechanics in nodejs?
dynamic model selection also something could be improved

I let it Open-source at: https://github.com/vinhnam/languageModeling
