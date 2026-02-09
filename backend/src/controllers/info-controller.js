const info = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is functional',
    error: {},
    data: {}
  });
};

module.exports = { info };
