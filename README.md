# Capco Portfolio Optimization Workshop #

Welcome to Capco Portfolio Optimization Workshop. Before we start, 
please follow the steps below in order to prepare for the workshop.

The core functionality will be implemented in Java backend module **spfa-server**. For a visualisation we need also Angular frontend module **spfa-client**.

### Workshop slides ###


### Git installation ###
Before we start, we need to install git client on a machine in order to checkout the
source code of the application. Please, download the client from the following link:
[Git download page](https://git-scm.com/downloads)

After the installation, you can checkout the repository running the following command from command
line in a directory you wish to download the sources to:

`git clone https://github.com/linner-stefan/portfolio-optimization-workshop`

### Java 8 SDK ###
Download and install the latest [Java 8 SDK](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).

### Node.js installation ###
The frontend module (spfa-client) uses Node.js 6.10.2 (with NPM 3.10.10). To install this Node.js version, download it from the previous versions page
[Node.js 6.10.2 Downloads](https://nodejs.org/download/release/v6.10.2/).

For Windows use _node-v6.10.2-x64.msi_ or _node-v6.10.2-x86.msi_
For Mac use _node-v6.10.2.pkg_

Verify the installation using commands `node -v` and `npm -v`.

_Note:_ If you already have a different Node.js version and you want to preserve both, use Node Version Manager (NVM), available for Windows and Mac.

### IDE ###
We recommend using JetBrains [IntelliJ IDEA Ultimate](https://www.jetbrains.com/idea/download/#section=mac), which probably allows the easiest setup and support for both Java backend and Angular frontend projects.

Recommended plugins:
- Git
- Spring
- Lombok
- Maven
- AngularJS
- NodeJS

Nevertheless, any IDE supporting Java development is sufficient.

### Maven install ###
(_not necessary when using IntelliJ IDEA with Maven plugin_)

The backend module (spfa-server) uses Maven as a build tool. In order to build the application from downloaded sources. To
install Maven on your machine, download it from following link:
[Maven download page](https://maven.apache.org/download.cgi)

After download, install Maven according to information in following link: 
[Maven install](https://maven.apache.org/install.html)
Make sure you can run the `mvn -v` in command line and see the version of installed Maven.

### Build and Run ###
#### Backend ####
##### IntelliJ IDEA #####
1. _Open_ 'spfa-server/spa-parent/pom.xml' file in IntelliJ as a project.

1. In 'File -> Project Structure -> SDK' add Java 8 SDK if missing.

1. In Maven Projects tool window select SPA Parent project lifecycles 'clean' and 'install' (using CTRL/CMD-click), enable Skip Tests Mode (icon with a lightning) and click Run Maven Build.

1. _Open_ 'SpaBackendApplication.java' file and run 'SpaBackendApplication' class with the green arrow run button next to the class declaration.

##### Other IDE #####
Run the following commands in native Command Prompt / Terminal.
1. `cd <clonned_project_path>/spfa-server/spa-parent`
1. `mvn clean install -DskipTests=true`
1. `cd <clonned_project_path>/spfa-server/spa-backend`
1. `mvn spring-boot:run`

#### Frontend ####
1. (not required) _Open_ 'spfa-client' folder in IntelliJ.

Run the following commands either in IntelliJ's Terminal or in native Command Prompt / Terminal.

1. `cd <clonned_project_path>/spfa-client`
1. `npm install`
1. `npm start`

### Usage ###
Open `http://localhost:4200/` in a browser (ideally Chrome) and authenticate with
* username: _user_
* password: _password_

You should be able to see the prepared GUI, but there is not much you can do yet.
More info on the workshop...

---

Looking forward to seeing you all...
