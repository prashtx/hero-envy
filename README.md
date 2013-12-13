heroku-env
==========

Configure a Heroku environment from a file

## Summary

If you have run several apps from the same codebase (production, beta, dev, funsies, etc.), it can get cumbersome to manage the various environment variables. Now you can use the same `.env` files you'd use for local development configurations, complete with comments, and configure your remote Heroku apps.

By default, the tool gets the app name from the environment file name. So you can use `awesomesauce-beta.env` to configure `awesomesauce-beta.herokuapp.com`.

## Installation

Install with `npm install heroku-env -g`.

## Usage

The basic form takes an environment file to read:

    $ herokuenv my-app-dev.env

You can override the app name:

    $ herokuenv be-careful-with-production.env --app my-app-production

You can specify an account:

    $ herokuenv my-app-dev.env --account personal

## Sample environment file

```
DATABASE="my_dev_db"
NAME="My Full Name" # Comments are OK
# The line below will get ignored
#LOGGING=QUIET
```
