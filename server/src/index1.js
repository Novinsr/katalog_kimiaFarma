const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;


app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send("Hello dari Server!");
});

app.get('/api/products',(req,res)=> {
    const produk = [
        {
            id: 1, nama: "kimia farma",
            harga: 2000
        },
        {
            id: 5, nama: "paracetamol", harga: 3000
        }
    ];
    res.json(produk);

})

app.listen(port,() => {
    console.log(`Server berhasil berjalan di http//localhost:${port}`)
}
);