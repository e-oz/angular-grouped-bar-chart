AngularJS directive to draw bar chart with D3
=============================================

##Attributes

 - tipHeight - offset from top for chart, to show tooltip inside chart area
 - tipClass - css class of tooltip box
 - titleTipClass - css class of tooltip text
 - barColors - array of colors for bars (will be iterated)
 - splitPairs - if we should split pairs of bars (by space) when each point have more than 2 values (true by default)
 - trendLines - if we should draw trend lines (for paired values, all second values will be concatenated by trend line), false by default
 - trPointRadius - trend line point radius
 - tpClass - trend line point css class
 - tlClass - trend line css class
 - axisOffsetX, Y - offsets for X and Y axis
 - labelFormatter - function will be called on tooltip rendering (on mouseover) and should return text (html) for label. Otherwise, label will be compiled from fields 'label' and 'value' (if field 'label' is defined) as 'label: value', or just from given value, if 'label' is not declared.
 - ngModel - data for chart. Should be in format:
   ```
	 {
	   values:[
		   points: [
			   labels: [
				   'Locke',
				   'Reyes',
				   'Ford',
				   'Jarrah',
				   'Shephard',
				   'Kwon'
				 ]
			   values: [
				   4,
				   8,
				   15,
				   16,
				   23,
				   42
				 ]
			 ]
		   title: 'Title of each point, will be on x axis'
		 ]
	   yAxisTitle: 'y axis'
	 }
   ```
