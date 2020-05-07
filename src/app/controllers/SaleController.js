const Sale = require("../models/Sale");
const User = require("../models/User");
const Report = require("../models/Report");
const { store: storeTaxe } = require("../controllers/TaxeController");

module.exports = {
  async store(req, res) {
    try {
      const {
        distributor,
        valueUnitary,
        amount,
        taxeSale,
        date,
        user_id,
      } = req.body;

      const user = await User.findById(user_id);

      if (!user)
        return res.status(203).json({ message: "Este usuário não existe!" });

      const unitary = parseFloat(valueUnitary.replace(",", "."));
      let valueLote = unitary * 100;
      let totalProfit = valueLote * amount;
      const data = {
        distributor,
        valueUnitary: unitary,
        amount,
        taxeSale: Number(taxeSale.replace(",", ".")) / 100,
        date,
        valueLote,
        total: totalProfit,
        isTaxes: false,
        user_id,
      };

      const sale = await Sale.create(data);
      const dataTax = {
        total: sale.total - sale.total * sale.taxeSale,
        date,
        isTaxes: sale.isTaxes,
        sale_id: sale._id,
      };
      const taxe = await storeTaxe(dataTax);
      const taxeDis = totalProfit * sale.taxeSale;

      const totalSaleTax = parseFloat(
        totalProfit.toFixed(4) - taxeDis.toFixed(4)
      );
      const totalfinal = parseFloat(
        totalSaleTax.toFixed(4) - taxe.taxeSale.toFixed(4)
      );
      const dataReport = {
        user_id: sale.user_id,
        sale_id: sale._id,
        totalProfit: totalProfit - (totalProfit - totalfinal),
        totalSales: sale.total,
        totalProducts: totalProfit - totalSaleTax,
        totalTaxes: totalProfit - totalfinal,
      };
      const report = await Report.create(dataReport);

      user.totalProfit += report.totalProfit;
      user.totalSale += report.totalSales;
      user.totalProduct += report.totalProducts;
      user.totalTaxes += report.totalTaxes;
      await user.save();

      return res.json(sale);
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Falha ao cadastrar!", error });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      if (!(await Sale.findById(id)))
        return res.status(400).json({ message: "Venda não encontrada!" });

      const {
        distributor,
        valueUnitary,
        amount,
        taxeSale,
        date,
        isTaxes,
        user_id,
      } = req.body;

      const user = await User.findById(user_id);
      if (!user)
        return res.status(400).json({ message: "Usuário não encontrado!" });

      const unitary = parseFloat(valueUnitary.replace(",", "."));
      let valueLote = unitary * 100;
      let totalProfit = valueLote * amount;

      const data = {
        distributor,
        valueUnitary: unitary,
        amount,
        taxeSale: Number(taxeSale.replace(",", ".")) / 100,
        date,
        valueLote,
        total: totalProfit,
        isTaxes,
      };

      const sale = await Sale.findByIdAndUpdate(
        id,
        { ...data, updatedAt: Date.now() },
        { new: true }
      );

      return res.json(sale);
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Falha na requisição!", error });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!(await Sale.findById(id)))
        return res.status(400).send({ message: "Venda não encontrada!" });

      await Sale.findByIdAndRemove(id);

      return res
        .status(200)
        .send({ message: "Registro deletado com sucesso!" });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Falha na requisição!", error });
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      const sale = await Sale.findById(id);

      if (!sale)
        return res.status(400).send({ message: "Venda não encontrada!" });

      return res.status(200).send(sale);
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Falha na requisição!", error });
    }
  },

  async index(req, res) {
    try {
      const sales = await Sale.find();
      return res.status(200).send(sales);
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Falha na requisição!", error });
    }
  },
};