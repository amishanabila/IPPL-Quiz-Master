import React from "react";
import Header from "./header/Header";
import KumpulanMateri from "./materi/KumpulanMateri";
import BannerBuatSoal from "./buat soal/BannerBuatSoal";
import Footer from "./footer/Footer";

export default function HalamanAwal() {
  return (
    <div>
      <Header/>
      <BannerBuatSoal/>
      <KumpulanMateri/>
      <Footer/>
    </div>
  );
}
