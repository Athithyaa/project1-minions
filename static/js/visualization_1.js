// Reference: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd

function initializeVis_1(vis_container_id, data=undefined) {

  if (!data) {
    d3.json("data/items.json", function(error, flare) {
      if (error) throw error;
      PlotCollapsibelTree(flare, vis_container_id);
    });
  }
  else {
    PlotCollapsibelTree(data, vis_container_id);
  }
}




function PlotCollapsibelTree(treeData, vis_container_id) {

  // Set the dimensions and margins of the diagram
  var margin = {top: 20, right: 90, bottom: 30, left: 90},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#vis_"+vis_container_id+"_svg_container")
                .append("g")
                .attr("id", "collapsible_tree_"+vis_container_id)
                .attr("transform", "translate(200, 0)");
  
  svg.attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");

  var i = 0,
      duration = 750,
      root;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }

  function update(source) {

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 180});

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .classed('node', true)
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', click)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .classed('node', true)
        .attr('r', 1e-6)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { 
          var text = d.data.name;
          return text; 
        })
        .style("fill", "black");

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d) { 
          return "translate(" + d.y + "," + d.x + ")";
       });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .classed('link', true)
        .attr('d', function(d){
          var o = {x: source.x0, y: source.y0}
          return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
          var o = {x: source.x, y: source.y}
          return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

      path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`

      return path
    }

    // Toggle children on click.
    function click(d) {
      if (d.parent == null) {
        MoveBackToMap(vis_container_id);
      }
      else if (d.children) {
          d._children = d.children;
          d.children = null;
      } 
      else {
          d.children = d._children;
          d._children = null;
      }
      update(d);
    }
    
    
    function mouseover(d) {
      console.log(d);
      if (d.parent == null) {
        d3.select("#collapsible_tree_"+vis_container_id)
          .append("text")
          .attr("id", "go_back_info_text_"+vis_container_id)
          .attr("x", -50)
          .attr("y", 150)
          .text("Click to Return")
          .style("fill", "white")
          .style("font-size", "22px")
          .style("opacity", 0)
          .style("stroke", "red");
        
        d3.select("#go_back_info_text_"+vis_container_id)
              .transition().duration(350).style("opacity", 1.0);
      }
    }
    
    function mouseout(d) {
      if (d.parent == null) {
        d3.select("#go_back_info_text_"+vis_container_id)
              .transition().duration(450).style("opacity", 0.0);
      }
    }
  }
  
  
  
}