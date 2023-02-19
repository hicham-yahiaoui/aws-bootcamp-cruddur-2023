FROM python:3.10-slim-buster

# Inside Container
# Make a new folder inside the container
WORKDIR /backend-flask

# Outside Container -> Inside Container
# requirements.txt contains the python libraries used for the app
COPY requirements.txt requirements.txt

# Inside Container
# Install the python libraries
RUN pip3 install -r requirements.txt

# Outside Container -> Inside Container
COPY . .

# Inside the container
# Set environment variables
ENV FLASK_ENV=development


EXPOSE ${PORT}

# 
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=4567"]