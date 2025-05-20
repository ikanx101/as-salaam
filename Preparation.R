# ============================================================
rm(list=ls())
gc()

library(dplyr)
library(tidyr)
library(parallel)

ncore = detectCores()
# ============================================================


# ============================================================
# qurban 2025
folder = "~/as-salaam/RAW/qurban 2025"
setwd(folder)

excel = list.files()
excel = excel[grepl("realisasi",excel,ignore.case = T)]

df = read.csv(excel,sep = ";") %>% janitor::clean_names()
row.names(df) = NULL

df_qurban_2025 = 
  df %>% 
  mutate(tanggal = as.Date(tanggal,"%d %B %Y")) %>% 
  rename(deskripsi = keterangan,
         kategori  = keterangan_1,
         input = `in`,
         output = `out`
         ) %>% 
  mutate(input = gsub("Rp\t","",input,fixed = T),
         input = gsub("\\.","",input)) %>% 
  mutate(output = gsub("Rp\t","",output,fixed = T),
         output = gsub("\\.","",output)) %>% 
  filter(!is.na(tanggal)) %>% 
  mutate(input  = as.numeric(input),
         output = as.numeric(output))
# ============================================================


# ============================================================
# dana operasional mushalla
folder = "~/as-salaam/RAW/saldo kas"
csvs   = list.files(folder,full.names = T)
file   = csvs[grepl("operasional",csvs,ignore.case = T)]

df = read.csv(file,sep = ";") %>% janitor::clean_names()
row.names(df) = NULL

str(df)

df_operasional = 
  df %>% 
  mutate(tanggal = as.Date(tanggal,"%d %B %Y")) %>% 
  rename(deskripsi = keterangan,
         input = `in`,
         output = `out`
  ) %>% 
  mutate(input = gsub("Rp\t","",input,fixed = T),
         input = gsub("\\.","",input)) %>% 
  mutate(output = gsub("Rp\t","",output,fixed = T),
         output = gsub("\\.","",output)) %>% 
  mutate(input  = gsub(" ","",input),
         output = gsub(" ","",output)) %>% 
  mutate(input  = as.numeric(input),
         output = as.numeric(output)) %>% 
  filter(!is.na(tanggal)) %>% 
  mutate(tahun = lubridate::year(tanggal),
         bulan = lubridate::month(tanggal,label = T)) %>% 
  select(-saldo)

# ============================================================


# ============================================================
# ini adalah data renovasi mushalla menjelang ramadhan
folder = "~/as-salaam/RAW/saldo kas"
csvs   = list.files(folder,full.names = T)
file   = csvs[grepl("renovasi",csvs,ignore.case = T)]

df = read.csv(file,sep = ";") %>% janitor::clean_names()
row.names(df) = NULL

str(df)

df_renov = 
  df %>% 
  mutate(tanggal = gsub("Februari","February",tanggal)) %>% 
  mutate(tanggal = as.Date(tanggal,"%d %B %Y")) %>% 
  select(-no) %>% 
  filter(!is.na(tanggal)) %>% 
  mutate(kategori = case_when(
    grepl("tukang|Rahmat",keterangan) ~ "Pembayaran tukang",
    grepl("Endang",keterangan) ~ "Pembelian sound system",
    grepl("infaq",keterangan) ~ "Infaq",
    grepl("Saldo",keterangan) ~ "Sisa saldo renovasi lalu",
    grepl("Sandra",keterangan) ~ "Kegiatan Ramadhan"
  ))
# ============================================================

# kita save semuanya dulu
setwd("~/as-salaam")
save(df_renov,df_operasional,df_qurban_2025,
     file = "all_data.rda")


