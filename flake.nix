{
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, flake-utils, nixpkgs }:
    let
      supportedSystems = [
        "x86_64-linux"
        "x86_64-darwin"
        "aarch64-linux"
        "aarch64-darwin"
      ];

    in 
      flake-utils.lib.eachSystem supportedSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          pkgsBeam = pkgs.beam.packagesWith pkgs.erlangR25;
        in {
          devShell = pkgs.mkShell {
            buildInputs = [
              pkgs.potrace
              pkgsBeam.erlang
              pkgsBeam.elixir_1_14
            ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
              pkgs.darwin.apple_sdk.frameworks.CoreServices
              pkgs.xcodebuild
            ];
          };
        }
      );
}
