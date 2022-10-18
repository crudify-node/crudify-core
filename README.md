<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <!-- <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="assets/logo.png" alt="Logo" width="80" height="80">
  </a> -->

  <h3 align="center">CRUDify</h3>

  <p align="center">
    A
command-line tool available as an NPM package which creates a starter backend project consisting of CRUD API endpoints
and a configured PostgreSQL database (using Prisma ORM) from just an ER Diagram which the user needs to provide in
JSON format.
    <br />
    <br />
    <a href="https://www.npmjs.com/package/crudify-dtu">Try it out</a>
    ·
    <a href="https://github.com/abhi-824/crudify/issues">Report Bug</a>
    ·
    <a href="https://github.com/abhi-824/crudify/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>
 -->

<!-- ABOUT THE PROJECT -->

## About The Project

CRUDify is a command-line tool to kickstart a backend project by just providing an ER Diagram.
<br>
<br>
The user needs to create a database
schema in JSON format and then install
the package. Next step is to invoke the package
from the command line and pass the
name of the schema file along with it.
<br>
<br>
This creates a backend project with the corresponding database schema file for Prisma ORM. Further, it also contains all the
endpoints for CRUD operations for all
database tables.

<br>

## Installation

Install the NPM package

```
yarn add crudify-dtu
```

```
npm i crudify-dtu
```

## Installation - Local Development

Install the dependencies

```
yarn install
```

Build the project in watch mode

```
yarn build -w
```

In a separate terminal, run the project

```
yarn dev
```

## How To Use

Consider the following ER Diagram

<p align="center">
<img src="https://user-images.githubusercontent.com/57593654/176952224-d029b872-e281-4b0c-9fbc-2567703f1a92.png" alt="BFS" width="700px">

Shown below will be the corresponding schema for CRUDify

```
{
  "Models": [
    {
      "name": "user",
      "attributes": {
        "StaticFields": [
          {
            "name": "email",
            "type": "String",
            "isUnique": true,
            "faker": {
              "module": "internet",
              "method": "email"
            }
          },
          {
            "name": "password",
            "type": "String",
            "toBeHashed": true,
            "faker": {
              "module": "internet",
              "method": "password"
            }
          },
          {
            "name": "name",
            "type": "String"
          }
        ],
        "RelationalFields": []
      }
    },
    {
      "name": "blog",
      "attributes": {
        "StaticFields": [
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "content",
            "type": "String"
          }
        ],
        "RelationalFields": [
          {
            "connection": "user",
            "foriegnKeyName": "id",
            "type": "ONETOMANY"
          }
        ]
      }
    },
    {
      "name": "review",
      "attributes": {
        "StaticFields": [
          {
            "name": "title",
            "type": "String"
          },
          {
            "name": "content",
            "type": "String"
          }
        ],
        "RelationalFields": [
          {
            "connection": "user",
            "foriegnKeyName": "id",
            "type": "ONETOMANY"
          },
          {
            "connection": "blog",
            "foriegnKeyName": "id",
            "type": "ONETOMANY"
          }
        ]
      }
    }
  ],
  "Authentication": {
    "model": "user",
    "userFieldName": "email",
    "passwordFieldName": "password"
  }
}
```

<p>Step 1: Create a new folder for your project</p>
<img src="https://user-images.githubusercontent.com/57593654/176953567-444396b0-8bb4-43d8-8881-7bf963659be9.png" alt="Step 1: Create a new folder for your project" width="700px">

<p>Step 2: Create your schema as a JSON file</p>
<img src="https://user-images.githubusercontent.com/57593654/176953572-d0dbfec7-1f10-4821-b128-1feea9aceae3.png" alt="Step 2: Create your schema as a JSON file" width="700px">

<p>Step 3: Install the crudify-dtu NPM package</p>
<img src="https://user-images.githubusercontent.com/57593654/176953573-39a69d7d-48f6-4288-a7a5-cdbe45a122e5.png" alt="Step 3: Install the crudify-dtu NPM package" width="700px">

<p>Step 4: CRUDify your ER Diagram using npx crudify-dtu “schema.json” command</p>
<img src="https://user-images.githubusercontent.com/57593654/176953577-a5c299b9-4ce7-4599-b10a-4dc6e2169ea5.png" alt="Step 4: CRUDify your ER Diagram using npx crudify-dtu “schema.json” command" width="700px">

<p>You can see the equivalent schema created in Prisma ORM in app/prisma/schema.prisma file
This schema is converted into raw SQL queries after setup (after Step 5) 
</p>
<img src="https://user-images.githubusercontent.com/57593654/176953580-7e04a74b-940f-450d-afd4-4a7bd1b7270d.png" alt="Equivalent schema created in Prisma ORM" width="700px">

<p>You can see app/src/routes/ contains the APIs for blog, review and user models</p>
<img src="https://user-images.githubusercontent.com/57593654/176953583-cd0f3799-897b-4de1-8f3c-769d23744dab.png" alt="APIs for blog, review and user models" width="700px">

<p>Step 5:  cd into app directory and follow the instructions shown below for setup</p>
<img src="https://user-images.githubusercontent.com/57593654/176953586-700d8001-1ea3-4ae0-b136-6aebb95cf7d4.png" alt="Instructions shown below for setup" width="700px">

Create a `.env` file at the root of the app and copy the content of `.example.env` file into it. Then, add your PostgreSQL username and password and replace the database name `starter` with a name of your choice. After creating the `.env` file, run the following commands:

```
yarn install
yarn prisma migrate dev
yarn build
yarn dev
```

## Syntax For Creating JSON Schema File

```
{
  "Models": [
    {
      "name": "MODEL_NAME",
      "attributes": {
        "StaticFields": [
          {
            "name": "FIELD_NAME",
            "type": "FIELD_TYPE",
            "isUnique": true,
            "toBeHashed": true,
            "faker": {
              "module": "MODULE_NAME",
              "method": "FUNCTION_NAME"
            }
          }
        ],
        "RelationalFields": [
          {
            "connection": "RELATED_TABLE_NAME",
            "foriegnKeyName": "id",
            "type": "CONNECTION_TYPE"
          }
        ]
      }
    }
  ],
  "Authentication": {
    "model": "YOUR_USER_MODEL_NAME",
    "userFieldName": "YOUR_USERNAME_FIELD_NAME",
    "passwordFieldName": "YOUR_PASSWORD_FIELD_NAME"
  }
}
```

**MODEL_NAME:** Name of the table (must be lowercase)
<br/>
**StaticFields:** Array of JSON objects with each object representing a non-relational field
<br/>
**FIELD_NAME:** Name of the field (must be lowercase)
<br/>
**FIELD_TYPE:** Type of the field (can be either `String` , `Boolean` , `Int` , `BigInt` , `Float` , `Decimal` , `DateTime` , `Json`)
<br/>
**isUnique:** Boolean that signifies whether the unique constraint should be applied to the field. Defaults to `false`, so can be omitted.
<br/>
**toBeHashed:** Boolean that signifies whether the field's value should be hashed before saving to the database. Defaults to `false`, so can be omitted.
<br/>
**faker:** Object representing the type of seed (fake) data that should be generated for the field. It is optional
<br/>
**module:** Name of the module (e.g. lorem) from https://fakerjs.dev/api/
<br/>
**method:** Name of the function to be called for the provided module [e.g. word (for lorem module)] from https://fakerjs.dev/api/
<br/>
**RelationalFields:** Array of JSON objects with each object representing a relational field
<br/>
**RELATED_TABLE_NAME:** Name of the table to which you want to create a relation to
<br/>
**foriegnKeyName:** Name of the field in the `RELATED_TABLE_NAME` table which should be made the foreign key. It should be set as `id` to set the default auto-generated primary key of the `RELATED_TABLE_NAME` table as the foreign key
<br/>
**CONNECTION_TYPE:** Can be either `ONETOMANY` or `ONETOONE`. In the case of `ONETOMANY` connection, one record in `RELATED_TABLE_NAME` will be related to many `MODEL_NAME` records
<br/>
<br/>
**USER AUTHENTICATION DETAILS**
<br/>
**Authentication:** An object containing information regarding user authentication. It is optional and should be added only if user authentication API endpoints are required (`login` and `getCurrentUser` currently)
<br/>
**model:** Name of the user model defined previously (case-sensitive)
<br/>
**userFieldName:** Name of the field in the user model corresponding to `username` (Must be a unique field)
<br/>
**passwordFieldName:** Name of the field in the user model corresponding to `password`

<p>

<br/>

</p>

<!-- There are many great README templates available on GitHub; however, I didn't find one that really suited my needs so I created this enhanced one. I want to create a README template so amazing that it'll be the last one you ever need -- I think this is it.

Here's why:
* Your time should be focused on creating something amazing. A project that solves a problem and helps others
* You shouldn't be doing the same tasks over and over like creating a README from scratch
* You should implement DRY principles to the rest of your life :smile:

Of course, no one template will serve all projects since your needs may be different. So I'll be adding more in the near future. You may also suggest changes by forking this repo and creating a pull request or opening an issue. Thanks to all the people have contributed to expanding this template!

Use the `BLANK_README.md` to get started.

<p align="right">(<a href="#top">back to top</a>)</p>


### Built With

This section should list any major frameworks/libraries used to bootstrap your project. Leave any add-ons/plugins for the acknowledgements section. Here are a few examples.

* [Next.js](https://nextjs.org/)
* [React.js](https://reactjs.org/)
* [Vue.js](https://vuejs.org/)
* [Angular](https://angular.io/)
* [Svelte](https://svelte.dev/)
* [Laravel](https://laravel.com)
* [Bootstrap](https://getbootstrap.com)
* [JQuery](https://jquery.com)

<p align="right">(<a href="#top">back to top</a>)</p>
 -->

<!-- GETTING STARTED
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

_Below is an example of how you can instruct your audience on installing and setting up your app. This template doesn't rely on any external dependencies or services._

1. Get a free API Key at [https://example.com](https://example.com)
2. Clone the repo
   ```sh
   git clone https://github.com/your_username_/Project-Name.git
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Enter your API in `config.js`
   ```js
   const API_KEY = 'ENTER YOUR API';
   ```

<p align="right">(<a href="#top">back to top</a>)</p>
 -->

<!-- USAGE EXAMPLES
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_

<p align="right">(<a href="#top">back to top</a>)</p>
 -->

<!-- ROADMAP
## Roadmap

- [x] Add Changelog
- [x] Add back to top links
- [ ] Add Additional Templates w/ Examples
- [ ] Add "components" document to easily copy & paste sections of the readme
- [ ] Multi-language Support
    - [ ] Chinese
    - [ ] Spanish

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>
-->

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Naman Gogia - [Linkedin](https://www.linkedin.com/in/namangogia/) - namangogia2001@gmail.com
<br>
Abhinandan Sharma - [Linkedin](https://www.linkedin.com/in/abhinandan-sharma-dtu/) - abhi.moudgil15@gmail.com

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS
## Acknowledgments

Use this space to list resources you find helpful and would like to give credit to. I've included a few of my favorites to kick things off!

* [Choose an Open Source License](https://choosealicense.com)
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
* [Malven's Flexbox Cheatsheet](https://flexbox.malven.co/)
* [Malven's Grid Cheatsheet](https://grid.malven.co/)
* [Img Shields](https://shields.io)
* [GitHub Pages](https://pages.github.com)
* [Font Awesome](https://fontawesome.com)
* [React Icons](https://react-icons.github.io/react-icons/search)

<p align="right">(<a href="#top">back to top</a>)</p>
-->
