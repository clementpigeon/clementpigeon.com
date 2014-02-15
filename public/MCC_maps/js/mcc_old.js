

//créer le SVG
var width = 700,
    height = 500;

// échelle pour le rayon des cercles
var rScale = d3.scale.linear()
  .domain([0, 1, 40])
  .rangeRound([0, 6, 45]);

// définir la projection et le path generator pour la carte
var projection = d3.geo.kavrayskiy7()
.scale(200)
.translate([width / 2-100, height / 2+40]);

var pathGenerator = d3.geo.path().projection(projection);

// créer le svg
var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// charger asynchronously le topoJSON et le CSV
queue()
.defer(d3.json, "maps/world-50m.json")
.defer(d3.csv, "data/mcc1.csv")
.await(ready);

// fonction principale, appelée quand les fichiers sont chargés
function ready (error, topojsonWorld, mccdata) {
    var currentYear = 1995;
  // décoder le topojson en geojson
  var geojsonWorld = topojson.object(topojsonWorld, topojsonWorld.objects.countries).geometries;
  // classer le mccdata par id
  mccdata = mccdata.sort(function(a, b){
      return a.id - b.id ;
    });

  svg.selectAll(".country")
    .data(geojsonWorld)
  .enter().append("path")
    .attr("class", function(country) {
      var classes = "country " + country.id;
      mccdata.forEach(function(mccCountry){
        if (country.id == mccCountry.id){
        classes += " mcc";
      }});
      return classes; })
    .attr("d", pathGenerator);

    // créer geojsonMcc et le trier dans l'ordre des id
  var geojsonMcc = geojsonWorld
  .filter(function(country){
    var isMcc = false;
    mccdata.forEach(function(mccCountry){
      if (country.id == mccCountry.id) {
        isMcc = true;
        };
    })
    return isMcc;
  })
  .sort(function(a, b){
    return a.id - b.id ;
  });

 function init(){
  svg.selectAll(".symbol")
      .data(mccdata)
    .enter().append("svg:circle")
      .attr("class", "symbol")
      .attr("cx", function(d, i) {
        return Math.round(pathGenerator.centroid(geojsonMcc[i])[0]);
      })
      .attr("cy", function(d, i) {
        return Math.round(pathGenerator.centroid(geojsonMcc[i])[1]);
        })
      .on("mouseover", hover)
      .on("mouseout", function(){
        $('.pays_popup').remove();
      });
  }

  function hover(d){   //le datum est passé en d
      var $tooltip = $("<div class='pays_popup'></div>");
      var x = parseInt($(this).attr("cx"))+15;
      // x = x+10;
      var y = parseInt($(this).attr("cy")) -15;
      $tooltip.html("<b>" + d.pays + "</b><br />" + d[currentYear] + " enfants");

      $('#wrapper').append($tooltip);
      $tooltip.css("left", x+"px");
      $tooltip.css("top", y+"px");
    }



 function update(year){
  $(".year").fadeOut(300, function(){
      $(this).html(currentYear).fadeIn(400);
    });

  $(".btn").removeClass("btn-danger");
  $(".btn#"+year).addClass("btn-danger");

  svg.selectAll(".symbol").transition()
    .duration(400)
    .attr("r", 0);

  svg.selectAll(".symbol").transition().delay(400)
    .duration(400)
    .attr("r", function(d) { return rScale(d[year]);});

  svg.selectAll(".labels").transition().delay(200)
  .text('')
  .transition().delay(400)
  .text(function(d){return d[year];})


  }

  function next(){
    currentYear++;
    if (currentYear > 2012) {
      currentYear = 1996;
    };
    update(currentYear);


  };

  function previous(){
    currentYear--;
    if (currentYear < 1996) {
      currentYear = 2012;
    };
    update(currentYear);
    $(".year").fadeOut(300, function(){
      $(this).html(currentYear).fadeIn(400);
    });

  };

  // function play (){
  //   setInterval(next, 2000);
  // }

  init();

  $("#next").click(next);
  $("#previous").click(previous);

  $(".year_btn").click(function(){
    currentYear = $(this).html();
    update(currentYear);
  });
}
