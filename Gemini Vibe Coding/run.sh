docker build -t ikanx101/dashboard-mushalla .
sudo docker tag ikanx101/dashboard-mushalla:latest ikanx101/dashboard-mushalla:latest
sudo docker push ikanx101/dashboard-mushalla:latest

# docker run -d -p 8080:80 --name kas-mushalla ikanx101/dashboard-mushalla:latest