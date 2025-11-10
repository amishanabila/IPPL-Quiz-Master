import React from "react";
import Header2 from "./header/Header2";
import KumpulanMateri from "./materi/KumpulanMateri";
import BannerBuatSoal from "./buat soal/BannerBuatSoal";

export default function HalamanAwal() {
  return (
    <div>
      <Header2/>
      <BannerBuatSoal/>
      <KumpulanMateri/>
    </div>
  );
}
