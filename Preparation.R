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
  select(-saldo) %>% 
  mutate(kategori = ifelse(grepl("kafalah",kategori,ignore.case = T),
                           "Kajian pekanan",
                           kategori)) %>% 
  mutate(timeline = format(tanggal,"%B %Y")) %>% 
  mutate(timeline = factor(timeline,
                           levels   = c("May 2024","June 2024","July 2024","August 2024","September 2024",
                                        "October 2024","November 2024","December 2024","January 2025",
                                        "February 2025","March 2025","April 2025","May 2025")
                           ),
         
         ) %>% 
  rename(in_trans  = input,
         out_trans = output)

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
  )) %>% 
  rename(in_put = `in`,
         out_put = `out`
  ) %>% 
  mutate(in_put = gsub("Rp","",in_put,fixed = T),
         in_put = gsub("\\.","",in_put)) %>% 
  mutate(out_put = gsub("Rp","",out_put,fixed = T),
         out_put = gsub("\\.","",out_put)) %>% 
  mutate(in_put  = gsub(" ","",in_put),
         out_put = gsub(" ","",out_put)) %>% 
  mutate(in_put  = stringr::str_trim(in_put),
         out_put = stringr::str_trim(out_put)) %>% 
  mutate(in_put  = as.numeric(in_put),
         out_put = as.numeric(out_put)) %>% 
  select(-saldo)

df_renov
# ============================================================

# kita save semuanya dulu
setwd("~/as-salaam")
save(df_renov,df_operasional,df_qurban_2025,
     file = "all_data.rda")


