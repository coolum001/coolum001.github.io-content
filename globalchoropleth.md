Title: Global Choropleth in Basemap
Date: 2017-02-20
Category: Basemap
Tags: basemap, python, choropleth, shapefile
Slug: Choropleth
Authors: Don Cameron
Summary: Choropleths on Basemap projections



# Global Choropleth#
So having mastered the art of drawing a global map in any projection I want, I then decided to try and create a global choropleth map.
A choropleth is a map where the geographic regions are color-coded to indicate the value of some attribute of interest.


The first issue that arises is how to specify the areas of interest.  The linga franca of geometry appears to be *shapefiles*; 
read about them [here](https://en.wikipedia.org/wiki/Shapefile).  The main point in their favour is that a lot (if not most) geospatial data 
that governments make available can be accessed as shapefiles (certainly in browsing Australian items of interest,
I only know of a few that are not released as shapefiles, and that is explained as:

>"2016 National electoral division dataset: Due to issues with boundary alignment between ABS Census Collection Districts and
>Statistical Area 1s, shapefile and MID/MIF national data sets need to be created out of the
>2013 national dataset and the recent 2016 NSW, WA and ACT files."


Shapefiles are actually a suite of files that contain spatial entities (geometries) and associated attribute values. 
The shapefiles may contain point, line, multiline, or polygon data.  A given conceptually entity may be defined by a single polygon 
(an Australian electorate in the interior of the country), or by many (an Australian electorate that includes many islands).  My hack-ish 
approach has been poke around in each shapefile to see what kinds of spatial and attribute data is present, but while I am sure 
it would be possible to automate this, it's all part of the fun.


For this example, I chose to get the country outlines from [Natural Earth](http://www.naturalearthdata.com/).  Now there are significant 
issues with defining 'what _is_ a country' (recognised by UN? recognised by ITU? etc, etc) - I am delegating all that to the Natural Earth people.
I will be using the estimated population of a country as my variable of interest.


The general concept flow is:

* Create a Basemap map


* Use an instance method of the map to read the shapefile, and optionally draw the boundaries spatial entities. When you read the shapefile,
you supply a string that is now the 'name' of an attribute of the map object, that can be used to access the shapefile spatial data;  
'name_info' can be used to access the associated attribute data.


    I must admit I blinked a bit at this building of object instance variables on the fly (being a ex-Java guy), but it is one example of Python's extremely dynamic programming style.


* For each shape, get the array of x,y (=longitude, latitude) coordinates, turn them into an array with numpy, and create a mapplotlib Polygon patch.
I am cheating here because I *know* there is only polygon data in the shapefile.


*  From the associated shape attributes get the data we wish to use to color the shape on the map.  In this case we get the estimated population.


*  Turn the patch list into a mapplotlib  Patch Collection  (this last is significant, because we can use a Patch Collection to create a color bar)


*  For each patch in the collection, set the value of the variable used to compute color from the colormap. Just as an aside, the method set_array()
is a little non-intuitive to me - but maybe set_array_used_to_compute_color() is a bit long.  In our case we use log10 of the population.


* A choropleth without a color bar is a little meaningless, so there is a little fiddling to get a scale the is meaningful 
(because we are using log10 of the origianl, we manually set tickmarks and tick labels)



### Import needed modules


The `math` and `numbers` modules are imported in the data cleaning below, but these are the plotting related modules needed.

		from mpl_toolkits.basemap import Basemap
		import matplotlib.pyplot as plt
		import numpy as np

		# these are needed for shapefile mgt 
		from matplotlib.patches import Polygon
		from matplotlib.collections import PatchCollection
		from matplotlib.patches import PathPatch



###  Create a Basemap map ###

A typical code fragment to create the underlying map looks like that below.  One point to note is that in some of my examples (to come)
I don't fill the whole continent, so uncomment the `m.fillcontinents(color='tan')` line to fill in the areas not covered by your polygons.  Also be sure to set an appropriate zorder for your polygons, or the continent fill may hide them.


I am unsure as to the idiom of creating a figure  by `plt.figure()`, and then adding a single subplot by `fig.add_subplot(111)`;  
I think it is to get a handle for the mapplotlib Axes object, that has some useful methods that we use below.  Note that the `111` means:
 "a grid of subplots one row by one column, and this is subplot one".  There may be other ways of getting the figure `Axes` object, but I am too lazy to research them.
		
		fig = plt.figure()
		ax = fig.add_subplot(111)
		m = Basemap(projection='gall',llcrnrlat=-70,urcrnrlat=90,\
            		llcrnrlon=-180,urcrnrlon=180,resolution='c')

		#m.fillcontinents(color='tan')
		m.drawmapboundary()

		m.drawparallels(np.arange(-80.,81.,20.))
		m.drawmeridians(np.arange(-180.,181.,20.)) 

### Reading the shapefile ###

Simple code:

		m.readshapefile('shapefiles/ne_10m_admin_0_countries', 
		                name='world', 
		                drawbounds=True, 
		                color='gray')

The file name translates to "Natural Earth, 1:10Million scale, administration boundaries at top level".  Be warned that the `drawbounds=True`
can cause problems if the shapefile ploygons span the Longitude 180 East / 180 West line.  The `name=world` means that we can subsequently refer
to `m.world` and `m.world_info` to get access to the shapefile data. 

### Processing the shapefile ###

The code below mixes data cleaning with spatial processing.  I probably should have used pandas/ geopandas to clean the data, but in this case,
this was the easiest approach.  I know by poking in the shapefile (and reading the Natural Earth site) that `POP_EST`  is the `info` attribute I want.
The main problems was the estimated population was not always a number, and not always > 0.   There may be a easier way to turn a shape into an array, but numpy is an automatic import to most of my code.
The end result of all this is to have two lists, `patches` and `population`.


I know the comments that end code blocks (`#end for`, etc)
are un-Pythonic, but they work for me. 

		import math   
		import numbers
		patches = []
		population  = []
		for info,shape in zip(m.world_info, m.world):
		    patches.append(Polygon(np.array(shape), True))
		    if( isinstance(info['POP_EST'], numbers.Number)  ):
		        try:
		            z = math.log10(info['POP_EST']+1.0)
		        except:
		            z = 0
		        #end try
		    else:
		        z = 0.0
		    #end if
 		   population.append(z)
    
		#end for


### Add polygons to matplotlib figure ###


We now add all this to the Axes object (one and one only) of our figure by:

		p = PatchCollection(patches, alpha=0.5,  zorder=3, cmap='rainbow')
		p.set_array(np.array(population))
		 
		ax.add_collection(p)


Note we set a `zorder` that is probably higher than it needs to be (but must be greater than the continent fill `zorder`, if used), and that we pick `rainbow` as our color map.
Color map choice is a very thorny problem, but in my eyes, it works here.  The `set_array()` defines the value used to set the color of a
given patch (in this case log base 10 of the estimated population).


### Create a color bar ###

The main detail with the color bar is that we have used log base 10 of the real number we are using as a color code.
So we manually set the color bar ticks, and manually set the labels at each tick (with some pleasing commas to separate the thousands).
My mental model is that the color bar creation makes a new Axes object,
and we can set the x-axis and y-axis of this Axes object independently of the main plot (rather than changing some attributes of the color bar).


We shrink the color bar so it doesn't overshadow the map.


		cb = fig.colorbar(p, ax=ax, shrink=0.6, ticks = range(0,10))
		tick_labels = ["{:,}".format(10**i) for i in range(0,10)]
		cb.ax.set_yticklabels(tick_labels) 
		cb.ax.set_xlabel('Country Population', size = 8)


### Finish the figure ###


Put on a title, and we are done!


		plt.title('World Choropleth')
		plt.show()


All this yields a map that looks like:


![Gloabal Population Choropleth]({filename}images/choropleth01.png)






The notebook that has all the code is [here]({filename}notebooks/WorldChoroplethNotebook.html)