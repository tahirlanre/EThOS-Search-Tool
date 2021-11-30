import os
from os import listdir
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering as aggl 
import matplotlib.pyplot as plt
from os.path import isfile, join
import pickle
import ATS_demo as esearch
import getTag as groupsystem
from tika import parser
import string
from pdf2image import convert_from_path, convert_from_bytes
from PIL import Image
from os import path
import math
import time
import collections
from shutil import copyfile
import spacy
first_run=0
nlp = None

# Paths (constants)
SUMMARISED_PATH = 'database/summarised/'
RAW_TEXT_PATH = 'database/raw_text/'
PREVIEWS_PATH = 'database/previews/'
DOWNLOADS_PATH = 'database/downloaded/'

PDF_INPUT_PATH = 'static/PDF_Files_Input/'
THUMBS_PATH = 'static/thumbs/'

WORD_VECTOR_PATH = 'database/word_vectors/'
NAMES_ORDER_PATH = 'database/name_orders.txt'

download_folder = os.path.dirname(os.path.abspath(__file__)) + "/database/downloaded"

# Globals
paper_queue = []
stop_word = []
stop_word_set = set()
all_paper_names = set()


papers_in_folder = {}

paper_locations = {}


changed_paper_names = {}

summarised_papers = {}
paper_previews = {}


word_vector_names_order = []
word_vector_matrix = []
#File to hold the hierachical clustering search system

# start by text summerisation as with the k means

# then do a keyword search on the summerised documents (10 keywords then take the x documents with the most matches)

# take these matching full texts then perform hierachical clustering on them 

# present the user with the clustering tree as a series of decisions presented in a binary tree with at each depth the user picking the more relevant cluster based on firstly extracted keywords or if they want the sumerizations of each thesis

# when the user is happy with the current group they then can 'check out and have their search completed'

# Adding key weighting
def key_search(keys):
	path = 'database/summarised'
	current = os.path.dirname(__file__)
	path = os.path.join(current, path)
	print(path)
	files = []
	for file in os.listdir(path):
		if file.endswith(".txt"):
			files.append([file,0])
	print(files)
	for x in range(0, len(keys)):
		keys[x][0] = keys[x][0].upper()

	for key in keys:
		for file in files:
			f = open(os.path.join(path, file[0]))
			content = f.read().replace("\n", " ")
			f.close()

			print(file)
			print(content)
			content = content.upper()
			print(key)
			print(content.count(key[0]))
			print(file[1])
			file[1] = file[1] + content.count(key[0]) * key[1] 
	files = sorted(files, key=lambda x: x[1], reverse=True)
	return files


	# for each
	# use grep in the summary txt files to return a list of tuples (filename, occurances)
	# select x most common and return the list of tuples

def agglomerative_clustering(word_matrix, name_order, files):
    print("create model")
    model = aggl(distance_threshold=None, n_clusters=8)
    print("fit matrix to model")
    print(word_matrix)
    model = model.fit(word_matrix)
    print("fitted")
    print(model)

    from scipy.cluster.hierarchy import dendrogram, linkage
    from scipy.cluster import hierarchy
    z = hierarchy.linkage(model.children_, 'ward')
    print(z)
    print(name_order)
    plt.figure(figsize=(20,10))
    print("values passed to leaf_label_func\nleaves : ", R["leaves"])

    # create a label dictionary
    temp = {R["leaves"][ii]: name_order[ii] for ii in range(len(R["leaves"]))}
    def llf(xx):
        return "{} - custom label!".format(temp[xx])
    dn = hierarchy.dendrogram(z)
    plt.show()

    return(model)

def create_word_vectors():
    global RAW_TEXT_PATH, WORD_VECTOR_PATH, NAMES_ORDER_PATH, all_paper_names, word_vector_names_order, word_vector_matrix
    

    matrix, names_order = groupsystem.create_word_matrix(all_paper_names, RAW_TEXT_PATH, WORD_VECTOR_PATH)

    with open(NAMES_ORDER_PATH, 'w') as f:
        for name in names_order:
            f.write("%s\n" % name)
    word_vector_names_order = names_order
    word_vector_matrix = matrix

def create_word_matrix(all_paper_names,RAW_TEXT_PATH, WORD_VECTOR_PATH):
    global nlp
    print("Creating word vectors...")
    
    print("Loading en_core_web_lg...")
    if nlp == None:
        nlp = spacy.load("en_core_web_lg")
    print("Complete")
    nlp.max_length = 2000000
    matrix = []
    names_order = []

    count = 0
    total = len(all_paper_names)

    print("Calculating word vectors. (May take some time)")

    for paper in all_paper_names:
        paper = paper[0]


        with open(RAW_TEXT_PATH + paper,'r') as f:  #, encoding="utf8"
            text = f.read()
            temp = nlp(text)



            matrix.append(temp.vector)
            names_order.append(paper)

            #np.savetxt(WORD_VECTOR_PATH + str(count) + ".txt", temp.vector, delimiter=',')

            count += 1
            print(str(round(count*100/total)) + "%. Finished vectors for: ", paper)
            

    
    matrix = np.array(matrix)
    print("Finished creating word vectors.")
    return matrix, names_order

def generate_vector(files):
	print('generate_vector')


files = key_search([['mining',5], ['text',1], ['python',1],['code',3], ['data',2]])
files = files[:9]
print(files)
matrix =[]
names_order = []
if(first_run):
    matrix, names_order = create_word_matrix(files,'database/raw_text/', WORD_VECTOR_PATH)
    print(matrix)
    f_matrix = open('matrix.txt', 'wb')
    f_names_order = open('names_order.txt', 'wb')
    pickle.dump(names_order, f_names_order)
    pickle.dump(matrix, f_matrix)
    f_matrix.close()
    f_names_order.close()
else:
    matrix = pickle.load(open("matrix.txt", 'rb'))
    names_order = pickle.load(open("names_order.txt", 'rb'))


print(names_order)
model = agglomerative_clustering(matrix, names_order, files)

