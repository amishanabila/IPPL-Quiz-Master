import React from "react";
import Header1 from "../src/header/Header1";
import KumpulanMateri from "./materi/KumpulanMateri";
import BannerBuatSoal from "./buat soal/BannerBuatSoal";

export default function HalamanAwal() {
  return (
    <div>
      <Header1/>
      <BannerBuatSoal/>
      <KumpulanMateri/>
    </div>
  );
}
