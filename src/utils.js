function regExpEscape(str) {
  if (!str)
    return str;
  return str.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

function formatCopayObject(copay) {
  function toNumber(val) {
    var num = parseFloat(('' + val).replace(/[^\d.-]/g, ''));
    if (isNaN(num))
      return 0;
    
    return num;
  }

  var subunitToUnit = toNumber(U.get(copay, 'currency.subunit_to_unit', 0)),
      fractional = toNumber(U.get(copay, 'fractional', 0)),
      currencySymbol = U.get(copay, 'currency.symbol', '$'),
      symbolFirst = U.get(copay, 'currency.symbol_first', true),
      price = (!subunitToUnit) ? 0 : (fractional / subunitToUnit).toFixed(2),
      priceFormatted = (copay)
        ? ((symbolFirst !== false)
          ? `${currencySymbol}${price}`
          : `${price}${currencySymbol}`)
        : '$0';

  return {
    copay,
    fractional,
    currencySymbol,
    symbolFirst,
    price,
    priceFormatted
  };
}

module.exports = Object.assign(module.exports, {
  regExpEscape,
  formatCopayObject
});
