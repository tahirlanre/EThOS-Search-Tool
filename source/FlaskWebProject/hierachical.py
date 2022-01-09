import os
from os import listdir
from os import path
from os.path import isfile, join

import math
import time
import numpy as np
import pandas as pd

import matplotlib.pyplot as plt
import pickle
import FlaskWebProject.getTag as groupsystem
from tika import parser
import string
from pdf2image import convert_from_path, convert_from_bytes
from PIL import Image


from shutil import copyfile

from sklearn.cluster import AgglomerativeClustering  
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage

import spacy
nlp = None

# Paths (constants)
SUMMARISED_PATH = 'FlaskWebProject/database/summarised/'
RAW_TEXT_PATH = 'FlaskWebProject/database/raw_text/'
PREVIEWS_PATH = 'FlaskWebProject/database/previews/'
DOWNLOADS_PATH = 'FlaskWebProject/database/downloaded/'

PDF_INPUT_PATH = 'FlaskWebProject/static/PDF_Files_Input/'
THUMBS_PATH = 'FlaskWebProject/static/thumbs/'

WORD_VECTOR_PATH = 'FlaskWebProject/database/word_vectors/'
NAMES_ORDER_PATH = 'FlaskWebProject/database/name_orders.txt'

download_folder = os.path.dirname(os.path.abspath(__file__)) + "FlaskWebProject//database/downloaded"

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
	#print(path)
	files = []
	for file in os.listdir(path):
		if file.endswith(".txt"):
			files.append([file,0])
	#print(files)
	for x in range(0, len(keys)):
		keys[x][0] = keys[x][0].upper()

	for key in keys:
		for file in files:
			f = open(os.path.join(path, file[0]))
			content = f.read().replace("\n", " ")
			f.close()

			#print(file)
			#print(content)
			content = content.upper()
			#print(key)
			#print(content.count(key[0]))
			#print(file[1])
			file[1] = file[1] + content.count(key[0]) * key[1] 
	files = sorted(files, key=lambda x: x[1], reverse=True)
	return files


	# for each
	# use grep in the summary txt files to return a list of tuples (filename, occurances)
	# select x most common and return the list of tuples
 
def get_all_filenames():
    path = 'database/summarised'
    current = os.path.dirname(__file__)
    path = os.path.join(current, path)
    #print(path)
    files = []
    for file in os.listdir(path):
        if file.endswith(".txt"):
            files.append([file,0])
    print(files)
    return files

def plot_dendrogram(model,name_order, **kwargs):
    # Create linkage matrix and then plot the dendrogram

    # create the counts of samples under each node
    counts = np.zeros(model.children_.shape[0])
    n_samples = len(model.labels_)
    for i, merge in enumerate(model.children_):
        current_count = 0
        for child_idx in merge:
            if child_idx < n_samples:
                current_count += 1  # leaf node
            else:
                current_count += counts[child_idx - n_samples]
        counts[i] = current_count

    linkage_matrix = np.column_stack(
        [model.children_, model.distances_, counts]
    ).astype(float)
    print(linkage_matrix)
    
    # Plot the corresponding dendrogram
    dendrogram(linkage_matrix, **kwargs)
    return(linkage_matrix)

def agglomerative_clustering(word_matrix, name_order, files):
    print("create model")
    plt.clf()

    model = AgglomerativeClustering(distance_threshold=0, n_clusters=None)

    model = model.fit(word_matrix)


    names_order_truncated = [name[:20] for name in name_order]

    linkage = plot_dendrogram(model,name_order,labels=names_order_truncated,  leaf_rotation = 90)

    tree = hierarchy.to_tree(linkage, rd=True)

    tree_root = tree[0]

    plt.xlabel("Number of points in node (or index of point if no parenthesis).")
    plt.tight_layout()
    os.remove("FlaskWebProject/static/dendograms/den.png")
    plt.savefig("FlaskWebProject/static/dendograms/den.png")

    return(model, linkage, tree)

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


#method to return all the file names of theses in a given subcluster on the bst
def get_child_leaf_names(tree_node, names_order):
    leaves = tree_node.pre_order(lambda x: x.id)
    labels = []
    for leaf in leaves:
        labels.append(names_order[leaf])
    return labels





def test():
    print('test')

def run_search(keys, first_run, breadth):
    print(keys)
    files = key_search(keys)
    files = files[:breadth]
    print(files)
    matrix =[]
    names_order = []
    if(first_run == 1):
        matrix, names_order = create_word_matrix(files,'FlaskWebProject/database/raw_text/', WORD_VECTOR_PATH)
        print(matrix)
        f_matrix = open('FlaskWebProject/matrix.txt', 'wb')
        f_names_order = open('FlaskWebProject/names_order.txt', 'wb')
        pickle.dump(names_order, f_names_order)
        pickle.dump(matrix, f_matrix)
        f_matrix.close()
        f_names_order.close()
    elif(first_run == 2):
        whole_matrix = pickle.load(open("FlaskWebProject/matrix.txt", 'rb'))
        whole_names_order = pickle.load(open("FlaskWebProject/names_order.txt", 'rb'))
        matrix = []
        files_bare = [file[0] for file in files]
        names_order = []
        for index in range(0,len(whole_names_order)):
            if whole_names_order[index] in files_bare:
                matrix.append(whole_matrix[index])
                names_order.append(whole_names_order[index])
    else:
        matrix = pickle.load(open("FlaskWebProject/matrix.txt", 'rb'))
        names_order = pickle.load(open("FlaskWebProject/names_order.txt", 'rb'))


    print(names_order)

    model, linkage, tree = agglomerative_clustering(matrix, names_order, files)
    tree_root = tree[0]
    #print(tree_root.get_left().pre_order(lambda x: x.id))

    #print(get_child_leaf_names(tree_root.get_left(), names_order))
    #print(names_order[tree_root.get_left().get_left().get_id()])
    return(tree, linkage, names_order)
    # now we have our bst
    # need to implement the digging function


    def compute_full_matrix():
        files = get_all_filenames()
        matrix, names_order = create_word_matrix(files,'FlaskWebProject/database/raw_text/', WORD_VECTOR_PATH)
        print(matrix)
        f_matrix = open('FlaskWebProject/matrix.txt', 'wb')
        f_names_order = open('FlaskWebProject/names_order.txt', 'wb')
        pickle.dump(names_order, f_names_order)
        pickle.dump(matrix, f_matrix)
        f_matrix.close()
        f_names_order.close()

