# Boston


## Getting started

### Makefile
```bash
$ make # updates repo
$ make data # grabs and processes data into pgres
```

### Dependencies
__wget__ `$ brew install wget`

__postgres__ `$ brew install postgresql`
([here's](https://www.moncefbelyamani.com/how-to-install-postgresql-on-a-mac-with-homebrew-and-lunchy/) a good resource for getting postgres set up and started on a mac)

Here's how I did it. 

1. Follow the website above. 
2. Then, 
```bash
$ createdb aclum
$ psql aclum
$ createuser paw
```

__postgis__ `$ brew install postgis`

__Mac GDL__ `$ brew install gdal` for access to commands in data handling, like `ogr2ogr`

#### possible CLI setup flow
```bash
$ make
$ make data # if you get the download done but run into errors and get interrupted, i used 
$ make data_deal_with # which should just do the converting and inserting stuff
$ make bower_init
$ make links
```




