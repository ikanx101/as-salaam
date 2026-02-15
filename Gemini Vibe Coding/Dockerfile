# Gunakan image nginx yang ringan sebagai dasar
FROM nginx:alpine

# Salin file HTML utama ke direktori default nginx
# Kita mengubah nama file menjadi index.html agar otomatis terbaca oleh nginx
COPY index.html /usr/share/nginx/html/index.html
COPY QRIS_Musholla.jpg /usr/share/nginx/html/QRIS_Musholla.jpg

# Ekspos port 80
EXPOSE 80

# Jalankan nginx
CMD ["nginx", "-g", "daemon off;"]