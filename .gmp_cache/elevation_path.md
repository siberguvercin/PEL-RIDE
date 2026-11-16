# Return the Difference in Elevation Along a Path

This workflow demonstrates how to use the Google Maps Elevation API (`web_api`)
to query elevation data sampled at equidistant intervals along a path defined by
two or more latitude/longitude coordinates, and how to compute the elevation
differences across those points.

--------------------------------------------------------------------------------

## 1. Endpoint Overview

Sampled path requests are constructed as an HTTPS GET request URL in the
following format:

```
https://maps.googleapis.com/maps/api/elevation/outputFormat?parameters
```

Where `outputFormat` can be:

-   `json` (recommended)
-   `xml`

> **Important Constraints:** - **HTTPS is required** for all requests using an
> API key. - URLs must be properly URL-encoded (e.g., `,` as `%2C` and `|` as
> `%7C`) and are limited to **16,384 characters**. - The `path` parameter
> supports a maximum of **512 coordinates/vertices**. Exceeding 512 points
> returns an `INVALID_REQUEST` status. - When querying multiple points or paths,
> some data smoothing occurs, resulting in coarser accuracy (larger `resolution`
> values) compared to single-point queries.

--------------------------------------------------------------------------------

## 2. Required Request Parameters

To request elevation along a path, you must include the following query
parameters separated by `&`:

Parameter | Required     | Description
:-------- | :----------- | :----------
`key`     | **Required** | Your application's Google Maps Platform API key.
`path`    | **Required** | Defines a set of two or more ordered `{latitude,longitude}` pairs specifying the vertices of a path on the earth. Accepted formats:<br>• **Pipe-separated coordinates:** `path=40.714728,-73.998672\|-34.397,150.644` (URL-encoded as `%7C`)<br>• **Encoded Polyline:** `path=enc:gfo}EtohhUxD@bAxJmGF`
`samples` | **Required** | Specifies the number of equidistant sample points along the path (inclusive of the endpoints) for which to return elevation data. For example, `samples=3` returns the start point, midpoint, and endpoint.

*Note: Latitudes must be between `-90` and `90`, and longitudes must be between
`-180` and `180`.*

--------------------------------------------------------------------------------

## 3. Step-by-Step Implementation

### Step 1: Construct and Execute the Request

Below is an example requesting 3 equidistant elevation samples along a
straight-line path from Mt. Whitney, CA (`36.578581,-118.291994`) to Badwater
Basin, CA (`36.23998,-116.83171`).

#### cURL Example

```bash
curl -L -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://maps.googleapis.com/maps/api/elevation/json?path=36.578581%2C-118.291994%7C36.23998%2C-116.83171&samples=3&key=YOUR_API_KEY&solution_id=gmp_git_agentskills_v1"
```

#### JavaScript (`fetch`) Example: Calculating Elevation Differences

The API returns the raw elevation (in meters) at each sampled point along the
path. To get the difference in elevation between the points (both
segment-by-segment and net change), compute the difference from the `results`
array:

```javascript
async function getElevationDifferenceAlongPath(apiKey) {
  // Define ordered path vertices [lat, lng]
  const pathVertices = [
    "36.578581,-118.291994", // Mt. Whitney, CA
    "36.23998,-116.83171"    // Badwater Basin, CA
  ];
  const samples = 3;

  const params = new URLSearchParams({
    path: pathVertices.join("|"),
    samples: samples.toString(),
    key: apiKey,
    solution_id: "gmp_git_agentskills_v1"
  });

  const url = `https://maps.googleapis.com/maps/api/elevation/json?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Maps-Solution-ID": "gmp_git_agentskills_v1"
    }
  });

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Elevation API Error: ${data.status} - ${data.error_message || "No details"}`);
  }

  const results = data.results;

  // Calculate net elevation difference from start to end of the path
  const startElevation = results[0].elevation;
  const endElevation = results[results.length - 1].elevation;
  const netElevationChange = endElevation - startElevation;

  // Calculate elevation difference between each consecutive sampled step
  const segmentDifferences = [];
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const curr = results[i];
    segmentDifferences.push({
      from: prev.location,
      to: curr.location,
      startElevationMeters: prev.elevation,
      endElevationMeters: curr.elevation,
      elevationDifferenceMeters: curr.elevation - prev.elevation
    });
  }

  return {
    netElevationChangeMeters: netElevationChange,
    segmentDifferences,
    rawSamples: results
  };
}
```

--------------------------------------------------------------------------------

## 4. Response Schema & Examples

### Sample JSON Response

```json
{
  "results": [
    {
      "elevation": 4411.94189453125,
      "location": { "lat": 36.578581, "lng": -118.291994 },
      "resolution": 19.08790397644043
    },
    {
      "elevation": 1372.8359375,
      "location": { "lat": 36.41150289067028, "lng": -117.5602607523847 },
      "resolution": 9.543951988220215
    },
    {
      "elevation": -84.51690673828125,
      "location": { "lat": 36.23998, "lng": -116.83171 },
      "resolution": 9.543951988220215
    }
  ],
  "status": "OK"
}
```

*From the response above:*

-   **Sample 1 to Sample 2 Difference:** `1372.84m - 4411.94m = -3039.11 meters`
-   **Sample 2 to Sample 3 Difference:** `-84.52m - 1372.84m = -1457.35 meters`
-   **Total Net Path Difference (Start to End):** `-84.52m - 4411.94m = -4496.46
    meters`

### Response Fields (`ElevationResponse`)

Field                  | Type                     | Description
:--------------------- | :----------------------- | :----------
`status`               | `string`                 | Top-level status code of the request (see Status Codes below).
`results`              | `Array<ElevationResult>` | Ordered list of elevation results corresponding to the sampled points along the path.
`results[].elevation`  | `number`                 | The elevation of the location in **meters**.
`results[].location`   | `LatLngLiteral`          | Object containing `lat` (number) and `lng` (number) in decimal degrees for the sampled point along the path.
`results[].resolution` | `number` *(optional)*    | Maximum distance (in meters) between data points from which the elevation was interpolated. Absent if unknown.
`error_message`        | `string` *(optional)*    | Detailed explanation when `status` is anything other than `OK`.

--------------------------------------------------------------------------------

## 5. Error Handling (`ElevationStatus`)

Always inspect the `status` field in the response payload:

-   `OK`: The API request succeeded and elevation samples are present in
    `results`.
-   `DATA_NOT_AVAILABLE`: No elevation data is available for the requested input
    locations.
-   `INVALID_REQUEST`: The request was malformed (e.g., missing `path` or
    `samples`, invalid lat/lng coordinates outside `[-90, 90]` / `[-180, 180]`,
    or exceeding 512 coordinates).
-   `OVER_DAILY_LIMIT`: API key is missing/invalid, billing is not enabled, a
    self-imposed usage cap was exceeded, or the payment method is no longer
    valid.
-   `OVER_QUERY_LIMIT`: The requestor has exceeded the allowed quota.
-   `REQUEST_DENIED`: The API did not complete the request.
-   `UNKNOWN_ERROR`: An unknown server error occurred.
