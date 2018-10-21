package com.capco.spa.service.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@JsonInclude(Include.NON_EMPTY)
@Getter
@Setter
@ToString(of= { "id", "name", "level"})
public class AssetClassGroupDto {

	private Long id;

	private Long definitionId;

	private String name;

	private Integer level;

	private BigDecimal volatility;

	@JsonProperty("subClasses")
	private List<AssetClassGroupDto> subGroups;

	@JsonProperty("assetClass")
	private AssetClassDto assetClassDto;

	@JsonProperty("allocationConstraint")
	private AllocationConstraintDto allocationConstraintDto;

	@Override
	public String toString() {
		return "AssetClassGroupDto [id=" + id + ", name=" + name + ", level=" + level + "]";
	}

	public Stream<AssetClassGroupDto> flattened() {
		return Stream.concat(
				Stream.of(this),
				getSubGroups()!=null? getSubGroups().stream().flatMap(AssetClassGroupDto::flattened) : Stream.empty());
	}
}
